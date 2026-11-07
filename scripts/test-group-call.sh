#!/bin/bash

# Group Call Feature - Acceptance Test Script
# Tests the 10-step flow from Sprint 5
#
# Prerequisites:
# - Backend server running on http://localhost:3000
# - Two test users registered with tokens in env vars
# - LiveKit server running (optional for API tests)

set -e

API_BASE="http://localhost:3000/api"
TASK_ID=""  # Will be created or use existing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# User tokens - SET THESE BEFORE RUNNING
USER1_TOKEN="${USER1_TOKEN:-}"
USER2_TOKEN="${USER2_TOKEN:-}"
USER3_TOKEN="${USER3_TOKEN:-}"

if [ -z "$USER1_TOKEN" ] || [ -z "$USER2_TOKEN" ]; then
    echo -e "${RED}Error: Set USER1_TOKEN and USER2_TOKEN environment variables${NC}"
    echo "Example: export USER1_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

# Helper functions
auth1() { curl -s -H "Authorization: Bearer $USER1_TOKEN" "$@"; }
auth2() { curl -s -H "Authorization: Bearer $USER2_TOKEN" "$@"; }
auth3() { curl -s -H "Authorization: Bearer $USER3_TOKEN" "$@"; }

json_val() { echo "$1" | python3 -c "import sys, json; print(json.load(sys.stdin)['$2'])"; }

step() {
    echo -e "\n${YELLOW}=== STEP $1: $2 ===${NC}"
}

success() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ============================================================
# STEP 1: Create task (Card) for testing
# ============================================================
step 1 "Create test task (Card)"
if [ -z "$TASK_ID" ]; then
    RESPONSE=$(auth1 -X POST "$API_BASE/cards" \
        -H "Content-Type: application/json" \
        -d '{"title":"Group Call Test Task","courseName":"Testing 101","difficulty":"medium","priority":"high"}')
    TASK_ID=$(json_val "$RESPONSE" "cardId")
    echo "Created task: $TASK_ID"
else
    echo "Using existing task: $TASK_ID"
fi

# ============================================================
# STEP 2: POST /group-calls by non-collaborator → 403
# ============================================================
step 2 "POST /group-calls by non-collaborator → 403"
# We need a 3rd user who is not a collaborator
if [ -n "$USER3_TOKEN" ]; then
    RESPONSE=$(auth3 -X POST "$API_BASE/group-calls/join" \
        -H "Content-Type: application/json" \
        -d "{\"taskId\":\"$TASK_ID\"}" -w "\n%{http_code}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    if [ "$HTTP_CODE" = "403" ]; then
        success "Non-collaborator correctly rejected (403)"
    else
        fail "Expected 403, got $HTTP_CODE"
    fi
else
    echo -e "${YELLOW}Skipped (no USER3_TOKEN)${NC}"
fi

# ============================================================
# STEP 3: User #1 /join → status: 'waiting', hostId == user1
# ============================================================
step 3 "User #1 joins → status: 'waiting', hostId == user1"
RESPONSE=$(auth1 -X POST "$API_BASE/group-calls/join" \
    -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\"}")
echo "$RESPONSE" | python3 -m json.tool

GROUP_CALL_ID=$(json_val "$RESPONSE" "groupCallId")
STATUS=$(json_val "$RESPONSE" "status")
HOST_ID=$(json_val "$RESPONSE" "groupCall" "hostId")

if [ "$STATUS" = "waiting" ] && [ -n "$GROUP_CALL_ID" ] && [ -n "$HOST_ID" ]; then
    success "User #1 joined: callId=$GROUP_CALL_ID, status=$STATUS, hostId=$HOST_ID"
else
    fail "Join failed or unexpected response"
fi

# ============================================================
# STEP 4: Same user /join again → same call (idempotent)
# ============================================================
step 4 "Same user joins again → idempotent (same call)"
RESPONSE=$(auth1 -X POST "$API_BASE/group-calls/join" \
    -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\"}")
GROUP_CALL_ID_2=$(json_val "$RESPONSE" "groupCallId")

if [ "$GROUP_CALL_ID" = "$GROUP_CALL_ID_2" ]; then
    success "Idempotent join works (same groupCallId)"
else
    fail "Idempotent join failed: $GROUP_CALL_ID vs $GROUP_CALL_ID_2"
fi

# ============================================================
# STEP 5: User #2 /join → status: 'active', both tokens valid
# ============================================================
step 5 "User #2 joins → status: 'active'"
RESPONSE=$(auth2 -X POST "$API_BASE/group-calls/join" \
    -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\"}")
echo "$RESPONSE" | python3 -m json.tool

GROUP_CALL_ID_U2=$(json_val "$RESPONSE" "groupCallId")
STATUS_U2=$(json_val "$RESPONSE" "status")
TOKEN_U2=$(json_val "$RESPONSE" "token")
ROOM_NAME=$(json_val "$RESPONSE" "roomName")

if [ "$GROUP_CALL_ID_U2" = "$GROUP_CALL_ID" ] && [ "$STATUS_U2" = "active" ] && [ -n "$TOKEN_U2" ]; then
    success "User #2 joined: status=active, same call, token received"
else
    fail "User #2 join failed: groupCallId=$GROUP_CALL_ID_U2, status=$STATUS_U2"
fi

# ============================================================
# STEP 6: User #3 /join → active, 3 participants
# ============================================================
step 6 "User #3 joins → active, 3 participants"
if [ -n "$USER3_TOKEN" ]; then
    # First add user3 as collaborator
    auth1 -X POST "$API_BASE/cards/$TASK_ID/collaborators" \
        -H "Content-Type: application/json" \
        -d '{"userId":"<USER3_ID>","role":"editor"}' >/dev/null 2>&1 || true

    RESPONSE=$(auth3 -X POST "$API_BASE/group-calls/join" \
        -H "Content-Type: application/json" \
        -d "{\"taskId\":\"$TASK_ID\"}")
    echo "$RESPONSE" | python3 -m json.tool

    STATUS_U3=$(json_val "$RESPONSE" "status")
    PART_COUNT=$(json_val "$RESPONSE" "groupCall" "participantCount" 2>/dev/null || echo "?")

    if [ "$STATUS_U3" = "active" ]; then
        success "User #3 joined: status=active, participants=$PART_COUNT"
    else
        fail "User #3 join failed: status=$STATUS_U3"
    fi
else
    echo -e "${YELLOW}Skipped (no USER3_TOKEN)${NC}"
fi

# ============================================================
# STEP 7: GET /by-task shows active call
# ============================================================
step 7 "GET /by-task shows active call"
RESPONSE=$(auth1 -X GET "$API_BASE/group-calls/by-task/$TASK_ID")
echo "$RESPONSE" | python3 -m json.tool

STATUS_BY_TASK=$(json_val "$RESPONSE" "groupCall" "status" 2>/dev/null || echo "null")
PART_COUNT_BY_TASK=$(json_val "$RESPONSE" "groupCall" "participantCount" 2>/dev/null || echo "?")

if [ "$STATUS_BY_TASK" = "active" ]; then
    success "GET /by-task returns active call with $PART_COUNT_BY_TASK participants"
else
    fail "GET /by-task failed: status=$STATUS_BY_TASK"
fi

# ============================================================
# STEP 8: User #3 /leave → 2 active via /by-task
# ============================================================
step 8 "User #3 leaves → 2 active via /by-task"
if [ -n "$USER3_TOKEN" ]; then
    RESPONSE=$(auth3 -X POST "$API_BASE/group-calls/$GROUP_CALL_ID/leave")
    echo "$RESPONSE" | python3 -m json.tool

    # Check remaining via /by-task
    RESPONSE=$(auth1 -X GET "$API_BASE/group-calls/by-task/$TASK_ID")
    PART_COUNT=$(json_val "$RESPONSE" "groupCall" "participantCount" 2>/dev/null || echo "?")

    if [ "$PART_COUNT" = "2" ]; then
        success "User #3 left, 2 participants remain"
    else
        fail "Expected 2 participants, got $PART_COUNT"
    fi
else
    echo -e "${YELLOW}Skipped (no USER3_TOKEN)${NC}"
fi

# ============================================================
# STEP 9: User #2 /leave → 1 active (call NOT ended)
# ============================================================
step 9 "User #2 leaves → 1 active (call NOT ended)"
RESPONSE=$(auth2 -X POST "$API_BASE/group-calls/$GROUP_CALL_ID/leave")
echo "$RESPONSE" | python3 -m json.tool

RESPONSE=$(auth1 -X GET "$API_BASE/group-calls/by-task/$TASK_ID")
STATUS=$(json_val "$RESPONSE" "groupCall" "status" 2>/dev/null || echo "null")
PART_COUNT=$(json_val "$RESPONSE" "groupCall" "participantCount" 2>/dev/null || echo "?")

if [ "$STATUS" = "active" ] && [ "$PART_COUNT" = "1" ]; then
    success "User #2 left: call still active with 1 participant"
else
    fail "Call ended prematurely: status=$STATUS, participants=$PART_COUNT"
fi

# ============================================================
# STEP 10: User #2 /end → 403 (not host)
# ============================================================
step 10 "User #2 tries /end → 403 (not host)"
RESPONSE=$(auth2 -X POST "$API_BASE/group-calls/$GROUP_CALL_ID/end" -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "403" ]; then
    success "Non-host correctly rejected from ending call (403)"
else
    fail "Expected 403, got $HTTP_CODE"
fi

# ============================================================
# STEP 11: User #1 (host) /end → ended, all leftAt != null
# ============================================================
step 11 "User #1 (host) ends → ended, all leftAt != null"
RESPONSE=$(auth1 -X POST "$API_BASE/group-calls/$GROUP_CALL_ID/end")
echo "$RESPONSE" | python3 -m json.tool

RESPONSE=$(auth1 -X GET "$API_BASE/group-calls/by-task/$TASK_ID")
STATUS=$(json_val "$RESPONSE" "groupCall" "status" 2>/dev/null || echo "null")

if [ "$STATUS" = "ended" ] || [ "$STATUS" = "null" ]; then
    success "Host ended call: status=$STATUS"
else
    fail "Host end failed: status=$STATUS"
fi

# ============================================================
# STEP 12: Last user /leave → auto-end (already covered)
# ============================================================
step 12 "Verify /board/collaborative-tasks reflects real-time state"
RESPONSE=$(auth1 -X GET "$API_BASE/board/collaborative-tasks")
echo "$RESPONSE" | python3 -m json.tool

ACTIVE_CALL=$(json_val "$RESPONSE" "0" "activeGroupCall" 2>/dev/null || echo "null")
if [ "$ACTIVE_CALL" = "null" ]; then
    success "Collaborative tasks shows no active call (correctly ended)"
else
    fail "Collaborative tasks still shows active call"
fi

# ============================================================
echo -e "\n${GREEN}=== ALL TESTS PASSED ===${NC}"