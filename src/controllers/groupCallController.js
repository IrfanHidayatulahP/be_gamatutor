const {
  createGroupCall,
  joinGroupCall,
  leaveGroupCall,
  endGroupCall,
  getGroupCallById,
  getGroupCallParticipants,
  getUserGroupCallHistory,
  updateGroupCallSettings,
  updateParticipantStatus,
  getGroupCallByTaskId,
} = require('../services/groupCallService');
const { generateGroupCallToken } = require('../services/livekitService');
const { Op } = require('sequelize');
const { Card, CardListCollab, User, GroupCall } = require('../models');
const { getIo } = require('../websocket/ioInstance');

const create = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }
    const groupCall = await createGroupCall(req.user.userId, req.body);
    res.status(201).json({ groupCall });
  } catch (error) {
    next(error);
  }
};

const joinByTask = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.userId;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

     // 🛠️ TAMBAHKAN VALIDASI UUID DI SINI
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId);
    if (!isUUID) {
      return res.status(400).json({ error: 'Format taskId tidak valid' });
    }

    // Validate user is owner OR collaborator on this task/card
    const card = await Card.findByPk(taskId);
    if (!card) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isOwner = card.userId === userId;
    let isCollaborator = false;

    if (!isOwner) {
      const collab = await CardListCollab.findOne({
        where: { cardId: taskId, userId }
      });
      isCollaborator = !!collab;
    }

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ error: 'Not a collaborator on this task' });
    }

    // Find or create group call
    let groupCall = await GroupCall.findOne({
      where: {
        taskId,
        status: { [Op.in]: ['waiting', 'active'] }
      },
      order: [['createdAt', 'DESC']],
    });

    if (!groupCall) {
      groupCall = await createGroupCall(userId, { taskId, title: card.title });
    }

    // Join the call (handles status transition waiting->active)
    groupCall = await joinGroupCall(groupCall.groupCallId, userId);

    // Get user info for token
    const user = await User.findByPk(userId, {
      attributes: ['userId', 'firstName', 'lastName', 'username']
    });
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.username;

    // Generate LiveKit token
    const { token, roomName, livekitUrl } = await generateGroupCallToken(
      userId,
      taskId,
      groupCall.groupCallId,
      userName
    );

    // Emit WS event to group call room
    const io = getIo();
    if (io) {
      io.emitToGroupCall(groupCall.groupCallId, 'group-call:user-joined', {
        groupCallId: groupCall.groupCallId,
        userId,
        userName,
        status: groupCall.status,
        participantCount: groupCall.participants?.length ?? 0,
      });
    }

    // Return flat JSON
    res.json({
      groupCallId: groupCall.groupCallId,
      token,
      roomName,
      livekitUrl,
      groupCall: {
        groupCallId: groupCall.groupCallId,
        taskId: groupCall.taskId,
        hostId: groupCall.hostId,
        title: groupCall.title,
        type: groupCall.type,
        status: groupCall.status,
        maxParticipants: groupCall.maxParticipants,
        startedAt: groupCall.startedAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

const leave = async (req, res, next) => {
  try {
    const result = await leaveGroupCall(req.params.groupCallId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const end = async (req, res, next) => {
  try {
    const result = await endGroupCall(req.params.groupCallId, req.user.userId);

    const io = getIo();
    if (io) {
      // 1. Broadcast ke room group call
      io.emitToGroupCall(req.params.groupCallId, 'group-call:ended', {
        groupCallId: req.params.groupCallId,
        reason: 'host_ended'
      });

      // 2. Kirim langsung ke setiap peserta yang ada di database
      if (result.participants && result.participants.length > 0) {
        result.participants.forEach(participantId => {
          // Pastikan Host sendiri juga tidak crash
          if (participantId !== req.user.userId) {
            io.emitToUser(participantId, 'group-call:ended', {
              groupCallId: req.params.groupCallId,
              reason: 'host_ended'
            });
          }
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
const getById = async (req, res, next) => {
  try {
    const groupCall = await getGroupCallById(req.params.groupCallId, req.user.userId);
    res.json({ groupCall });
  } catch (error) {
    next(error);
  }
};

const getParticipants = async (req, res, next) => {
  try {
    const participants = await getGroupCallParticipants(req.params.groupCallId, req.user.userId);
    res.json({ participants });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const groupCalls = await getUserGroupCallHistory(req.user.userId, filters);
    res.json({ groupCalls });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const groupCall = await updateGroupCallSettings(req.params.groupCallId, req.user.userId, req.body);
    res.json({ groupCall });
  } catch (error) {
    next(error);
  }
};

const updateParticipant = async (req, res, next) => {
  try {
    const participant = await updateParticipantStatus(req.params.groupCallId, req.params.participantId, req.user.userId, req.body);
    res.json({ participant });
  } catch (error) {
    next(error);
  }
};

const getByTaskId = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const groupCall = await getGroupCallByTaskId(taskId);
    if (!groupCall) {
      return res.json({ groupCall: null });
    }
    res.json({ groupCall });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  joinByTask,
  leave,
  end,
  getById,
  getParticipants,
  getHistory,
  updateSettings,
  updateParticipant,
  getByTaskId
};