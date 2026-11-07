const { GroupCall, GroupCallParticipant, User, Card, CardListCollab, CallActivity, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { generateGroupCallToken } = require('./livekitService');

const createGroupCallActivity = async (groupCallId, userId, activityType, metadata = {}) => {
  return CallActivity.create({ groupCallId, userId, activityType, metadata });
};

const createGroupCall = async (hostId, data) => {
  const { taskId } = data;

  if (!taskId) {
    throw new AppError('taskId is required', 400);
  }

  // Validate host is owner OR collaborator
  const card = await Card.findByPk(taskId);
  if (!card) {
    throw new AppError('Task not found', 404);
  }

  const isOwner = card.userId === hostId;
  let isCollaborator = false;

  if (!isOwner) {
    const collab = await CardListCollab.findOne({
      where: { cardId: taskId, userId: hostId }
    });
    isCollaborator = !!collab;
  }

  if (!isOwner && !isCollaborator) {
    throw new AppError('Not a collaborator on this task', 403);
  }

  // Idempotency: return existing call if waiting or active
  const existingCall = await GroupCall.findOne({
    where: {
      taskId,
      status: { [Op.in]: ['waiting', 'active'] }
    },
    include: [
      { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
    ]
  });

  if (existingCall) {
    return existingCall;
  }

  const transaction = await sequelize.transaction();

  try {
    const groupCall = await GroupCall.create({
      hostId,
      taskId,
      title: data.title || card.title,
      type: 'audio',
      status: 'waiting',
      maxParticipants: data.maxParticipants || 10,
      settings: data.settings || {
        allowScreenShare: true,
        allowChat: true,
        muteOnEntry: false
      }
    }, { transaction });

    // Add host as participant
    await GroupCallParticipant.create({
      groupCallId: groupCall.groupCallId,
      userId: hostId,
      role: 'host',
      joinedAt: new Date(),
      connectionStatus: 'connected'
    }, { transaction });

    await createGroupCallActivity(groupCall.groupCallId, hostId, 'call_initiated', { title: data.title || card.title }, transaction);

    await transaction.commit();

    return GroupCall.findByPk(groupCall.groupCallId, {
      include: [
        { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const joinGroupCall = async (groupCallId, userId) => {
  const groupCall = await GroupCall.findByPk(groupCallId, {
    include: [{ model: GroupCallParticipant, as: 'participants' }]
  });

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  if (groupCall.status === 'ended' || groupCall.status === 'cancelled') {
    throw new AppError('Group call has ended', 400);
  }

  // Check if already a participant
  const existingParticipant = await GroupCallParticipant.findOne({
    where: { groupCallId, userId }
  });

  if (existingParticipant) {
    // Reconnect
    await existingParticipant.update({
      joinedAt: new Date(),
      leftAt: null,
      connectionStatus: 'connected',
      isMuted: groupCall.settings?.muteOnEntry || false
    });

    await createGroupCallActivity(groupCallId, userId, 'participant_joined', { rejoined: true });

    return GroupCall.findByPk(groupCallId, {
      include: [
        { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });
  }

  // Check max participants
  const activeParticipantCount = await GroupCallParticipant.count({ where: { groupCallId, leftAt: null } });
  if (activeParticipantCount >= groupCall.maxParticipants) {
    throw new AppError('Group call is full', 409);
  }

  const transaction = await sequelize.transaction();

  try {
    const participant = await GroupCallParticipant.create({
      groupCallId,
      userId,
      role: groupCall.hostId === userId ? 'host' : 'participant',
      joinedAt: new Date(),
      connectionStatus: 'connected',
      isMuted: groupCall.settings?.muteOnEntry || false
    }, { transaction });

    // If status is waiting and this makes 2+ active participants, transition to active
    if (groupCall.status === 'waiting') {
      const newActiveCount = activeParticipantCount + 1;
      if (newActiveCount >= 2) {
        await groupCall.update({ status: 'active', startedAt: new Date() }, { transaction });
        await createGroupCallActivity(groupCallId, userId, 'call_started', {}, transaction);
      }
    } else {
      await createGroupCallActivity(groupCallId, userId, 'participant_joined', {}, transaction);
    }

    await transaction.commit();

    return GroupCall.findByPk(groupCallId, {
      include: [
        { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const leaveGroupCall = async (groupCallId, userId) => {
  const groupCall = await GroupCall.findByPk(groupCallId, {
    include: [{ model: GroupCallParticipant, as: 'participants' }]
  });

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  const participant = await GroupCallParticipant.findOne({
    where: { groupCallId, userId, leftAt: null }
  });

  if (!participant) {
    // Idempotent: already left or not in call
    return { message: 'Not in call', groupCallId };
  }

  const transaction = await sequelize.transaction();

  try {
    await participant.update({
      leftAt: new Date(),
      connectionStatus: 'disconnected'
    }, { transaction });

    await createGroupCallActivity(groupCallId, userId, 'participant_left', {}, transaction);

    // Count remaining active participants
    const remainingActive = await GroupCallParticipant.count({
      where: { groupCallId, leftAt: null }
    });

    let hostTransferred = false;
    let newHostId = null;

    // If host leaves, transfer host to longest-joined remaining participant
    if (groupCall.hostId === userId && remainingActive > 0) {
      const newHostParticipant = await GroupCallParticipant.findOne({
        where: {
          groupCallId,
          userId: { [Op.ne]: userId },
          leftAt: null
        },
        order: [['joinedAt', 'ASC']]
      });

      if (newHostParticipant) {
        await groupCall.update({ hostId: newHostParticipant.userId }, { transaction });
        await newHostParticipant.update({ role: 'host' }, { transaction });
        hostTransferred = true;
        newHostId = newHostParticipant.userId;
      }
    }

    // If no more participants, end the call
    if (remainingActive === 0) {
      await groupCall.update({ status: 'ended', endedAt: new Date() }, { transaction });
      await createGroupCallActivity(groupCallId, userId, 'call_ended', { reason: 'no_participants' }, transaction);
    }

    await transaction.commit();

    return {
      message: 'Left group call',
      groupCallId,
      hostTransferred,
      newHostId
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const endGroupCall = async (groupCallId, userId) => {
  const groupCall = await GroupCall.findByPk(groupCallId);

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  if (groupCall.hostId !== userId) {
    throw new AppError('Only host can end the group call', 403);
  }

  if (groupCall.status === 'ended') {
    return { message: 'Group call already ended', groupCallId };
  }

  const transaction = await sequelize.transaction();

  try {
    await groupCall.update({ status: 'ended', endedAt: new Date() }, { transaction });

    await GroupCallParticipant.update(
      { leftAt: new Date(), connectionStatus: 'disconnected' },
      { where: { groupCallId, leftAt: null }, transaction }
    );

    await createGroupCallActivity(groupCallId, userId, 'call_ended', { reason: 'host_ended' }, transaction);

    await transaction.commit();

    return { message: 'Group call ended', groupCallId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getGroupCallById = async (groupCallId, userId) => {
  const groupCall = await GroupCall.findByPk(groupCallId, {
    include: [
      { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
    ]
  });

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  // Check if user is participant or host
  const isParticipant = await GroupCallParticipant.findOne({ where: { groupCallId, userId } });
  const isHost = groupCall.hostId === userId;

  if (!isParticipant && !isHost) {
    throw new AppError('Not authorized', 403);
  }

  return groupCall;
};

const getGroupCallParticipants = async (groupCallId, userId) => {
  const groupCall = await GroupCall.findByPk(groupCallId);

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  // Check if user is participant or host
  const isParticipant = await GroupCallParticipant.findOne({ where: { groupCallId, userId } });
  const isHost = groupCall.hostId === userId;

  if (!isParticipant && !isHost) {
    throw new AppError('Not authorized', 403);
  }

  return GroupCallParticipant.findAll({
    where: { groupCallId },
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['joinedAt', 'ASC']]
  });
};

const getUserGroupCallHistory = async (userId, filters = {}) => {
  const where = {};

  // Find group calls where user is host or participant
  const participantCalls = await GroupCallParticipant.findAll({
    where: { userId },
    attributes: ['groupCallId'],
    raw: true
  });

  const callIds = participantCalls.map(p => p.groupCallId);

  where[Op.or] = [
    { hostId: userId },
    { groupCallId: { [Op.in]: callIds } }
  ];

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt[Op.gte] = filters.fromDate;
    if (filters.toDate) where.createdAt[Op.lte] = filters.toDate;
  }

  return GroupCall.findAll({
    where,
    include: [
      { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const updateGroupCallSettings = async (groupCallId, userId, settings) => {
  const groupCall = await GroupCall.findByPk(groupCallId);

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  if (groupCall.hostId !== userId) {
    throw new AppError('Only host can update settings', 403);
  }

  return groupCall.update({ settings: { ...groupCall.settings, ...settings } });
};

const updateParticipantStatus = async (groupCallId, participantId, userId, data) => {
  const groupCall = await GroupCall.findByPk(groupCallId);

  if (!groupCall) {
    throw new AppError('Group call not found', 404);
  }

  const participant = await GroupCallParticipant.findByPk(participantId);

  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  if (participant.groupCallId !== groupCallId) {
    throw new AppError('Participant not in this call', 400);
  }

  // Only host/moderator can update others, users can update themselves
  if (userId !== participant.userId && groupCall.hostId !== userId) {
    const requesterParticipant = await GroupCallParticipant.findOne({ where: { groupCallId, userId } });
    if (!requesterParticipant || requesterParticipant.role === 'participant') {
      throw new AppError('Not authorized', 403);
    }
  }

  const allowedFields = ['isMuted', 'isVideoEnabled', 'isScreenSharing', 'role'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  await participant.update(updateData);

  // Log activity
  if (data.isMuted !== undefined) {
    await createGroupCallActivity(groupCallId, userId, data.isMuted ? 'participant_muted' : 'participant_unmuted', { targetUserId: participant.userId });
  }
  if (data.isVideoEnabled !== undefined) {
    await createGroupCallActivity(groupCallId, userId, data.isVideoEnabled ? 'video_enabled' : 'video_disabled', { targetUserId: participant.userId });
  }
  if (data.isScreenSharing !== undefined) {
    await createGroupCallActivity(groupCallId, userId, data.isScreenSharing ? 'screen_share_started' : 'screen_share_stopped', { targetUserId: participant.userId });
  }

  return participant;
};

const getGroupCallByTaskId = async (taskId) => {
  // Find group call by taskId column
  return GroupCall.findOne({
    where: {
      taskId,
      status: { [Op.in]: ['waiting', 'active'] }
    },
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'host', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: GroupCallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
    ]
  });
};

module.exports = {
  createGroupCall,
  joinGroupCall,
  leaveGroupCall,
  endGroupCall,
  getGroupCallById,
  getGroupCallByTaskId,
  getGroupCallParticipants,
  getUserGroupCallHistory,
  updateGroupCallSettings,
  updateParticipantStatus,
  createGroupCallActivity
};