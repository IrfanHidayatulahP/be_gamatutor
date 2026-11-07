'use strict';

function parseJson(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : v;
  } catch (_) {
    return fallback;
  }
}

function serializeSession(s) {
  let insight = null;
  if (s.ai_insight) {
    const a = parseJson(s.ai_analysis, {});
    insight = {
      text: s.ai_insight,
      reason: s.ai_reason || '',
      recommended_difficulty: s.ai_recommended_difficulty,
      source: s.analysis_source || 'fallback',
      concept_coverage: a.concept_coverage ?? null,
      concept_accuracy: a.concept_accuracy ?? null,
      key_elements: a.key_elements || [],
      knowledge_gaps: a.knowledge_gaps || []
    };
  }
  return {
    id: s.id,
    status: s.status,
    attempt_no: s.attempt_no,
    course: s.course,
    task_title: s.task_title,
    initial_confidence: s.initial_confidence,
    articulation_text: s.articulation_text ?? null,
    word_count: s.word_count ?? null,
    insight,
    revised_confidence: s.revised_confidence ?? null,
    confidence_delta: s.confidence_delta ?? null,
    task_id: s.task_id ?? null,
    created_at: s.created_at,
    completed_at: s.completed_at ?? null
  };
}

function durationMinutes(startedAt, doneAt) {
  if (!startedAt || !doneAt) return null;
  const ms = new Date(doneAt) - new Date(startedAt);
  return Math.max(0, Math.floor(ms / 60000));
}

/** task: instance Sequelize dengan subtasks & links sudah dimuat; session: sesi micro-goal atau null. */
function serializeTask(t, session) {
  let microGoal = null;
  if (session && session.status === 'completed') {
    const rec = session.ai_recommended_difficulty;
    microGoal = {
      session_id: session.id,
      attempt_no: session.attempt_no,
      initial_confidence: session.initial_confidence,
      revised_confidence: session.revised_confidence,
      confidence_delta: session.confidence_delta,
      ai_recommended_difficulty: rec ?? null,
      followed_recommendation: rec && t.difficulty ? rec === t.difficulty : null
    };
  }
  const byPos = (a, b) => a.position - b.position || a.id - b.id;
  return {
    id: t.id,
    course: t.course,
    title: t.title,
    description: t.description,
    strategy: t.strategy,
    strategy_methods: parseJson(t.strategy_methods, []),
    learning_goal: t.learning_goal,
    priority: t.priority,
    deadline_date: t.deadline_date ?? null,
    deadline_time: t.deadline_time ?? null,
    difficulty: t.difficulty ?? null,
    track_grades: !!t.track_grades,
    subtasks: [...(t.subtasks || [])].sort(byPos).map((s) => ({ id: s.id, title: s.title, is_done: !!s.is_done })),
    links: [...(t.links || [])].sort(byPos).map((l) => ({ id: l.id, title: l.title, url: l.url })),
    micro_goal: microGoal,
    created_at: t.created_at,
    status: t.status,
    started_at: t.started_at ?? null,
    done_at: t.done_at ?? null,
    duration_minutes: durationMinutes(t.started_at, t.done_at),
    felt_difficulty: t.felt_difficulty ?? null,
    reward_id: t.reward_id ?? null
  };
}

module.exports = { serializeSession, serializeTask, parseJson };
