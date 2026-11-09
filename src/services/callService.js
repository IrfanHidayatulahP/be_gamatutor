const { Call, CallParticipant, User, CallActivity, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createCallActivity = async (callId, userId, activityType, metadata = {}, transaction = null) => {
  return CallActivity.create({ callId, userId, activityType, metadata }, { transaction });
};

const initiateCall = async (callerId, calleeId, type, signalingData = {}) => {
  if (callerId === calleeId) {
    throw new AppError('Cannot call yourself', 400);
  }

  const callee = await User.findByPk(calleeId);
  if (!callee) {
    throw new AppError('Callee not found', 404);
  }

  // Check if callee has an active call
  const activeCall = await Call.findOne({
    where: {
      [Op.or]: [
        { callerId: calleeId },
        { calleeId: calleeId }
      ],
      status: { [Op.in]: ['pending', 'ringing', 'answered'] }
    }
  });

  if (activeCall) {
    throw new AppError('User is currently in a call', 409);
  }

  const transaction = await sequelize.transaction();

  try {
    const call = await Call.create({
      callerId,
      calleeId,
      type,
      status: 'pending',
      signalingData
    }, { transaction });

    // Create caller participant
    await CallParticipant.create({
      callId: call.callId,
      userId: callerId,
      role: 'host',
      joinedAt: new Date(),
      connectionStatus: 'connecting'
    }, { transaction });

    // Create callee participant
    await CallParticipant.create({
      callId: call.callId,
      userId: calleeId,
      role: 'participant',
      connectionStatus: 'connecting'
    }, { transaction });

    // Log activity
    await createCallActivity(call.callId, callerId, 'call_initiated', { calleeId, type }, transaction);

    await transaction.commit();

    // Fetch with associations
    return Call.findByPk(call.callId, {
      include: [
        { model: User, as: 'caller', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: User, as: 'callee', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: CallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const answerCall = async (callId, userId, signalingData = {}) => {
  const call = await Call.findByPk(callId, {
    include: [{ model: CallParticipant, as: 'participants' }]
  });

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.calleeId !== userId) {
    throw new AppError('Not authorized to answer this call', 403);
  }

  // If already answered, return call with fresh tokens (idempotent)
  if (call.status === 'answered') {
    const { generateCallToken } = require('../services/livekitService');
    const { token, roomName, livekitUrl } = await generateCallToken(call.calleeId, call.callerId, call.callId);

    const callWithTokens = await Call.findByPk(callId, {
      include: [
        { model: User, as: 'caller', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: User, as: 'callee', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: CallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });

    return { ...callWithTokens.toJSON(), token, roomName, livekitUrl };
  }

  if (call.status !== 'pending' && call.status !== 'ringing') {
    throw new AppError('Call cannot be answered', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    await call.update({
      status: 'answered',
      startedAt: new Date(),
      signalingData: { ...call.signalingData, ...signalingData }
    }, { transaction });

    // Update callee participant
    await CallParticipant.update(
      { joinedAt: new Date(), connectionStatus: 'connected' },
      { where: { callId, userId }, transaction }
    );

    // Update caller participant
    await CallParticipant.update(
      { connectionStatus: 'connected' },
      { where: { callId, userId: call.callerId }, transaction }
    );

    await createCallActivity(callId, userId, 'call_answered', { signalingData }, transaction);

    await transaction.commit();

    return Call.findByPk(callId, {
      include: [
        { model: User, as: 'caller', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: User, as: 'callee', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        { model: CallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const rejectCall = async (callId, userId) => {
  const call = await Call.findByPk(callId);

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.calleeId !== userId) {
    throw new AppError('Not authorized to reject this call', 403);
  }

  if (call.status !== 'pending' && call.status !== 'ringing') {
    throw new AppError('Call cannot be rejected', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    await call.update({
      status: 'rejected',
      endedAt: new Date()
    }, { transaction });

    await CallParticipant.update(
      { leftAt: new Date(), connectionStatus: 'disconnected' },
      { where: { callId }, transaction }
    );

    await createCallActivity(callId, userId, 'call_rejected', {}, transaction);

    await transaction.commit();

    return { message: 'Call rejected', callId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const endCall = async (callId, userId) => {
  const call = await Call.findByPk(callId, {
    include: [{ model: CallParticipant, as: 'participants' }]
  });

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new AppError('Not authorized to end this call', 403);
  }

  if (call.status === 'ended') {
    return { message: 'Call already ended', callId };
  }

  const transaction = await sequelize.transaction();

  try {
    const endedAt = new Date();
    let duration = 0;
    if (call.startedAt) {
      duration = Math.floor((endedAt - call.startedAt) / 1000);
    }

    await call.update({
      status: 'ended',
      endedAt,
      duration
    }, { transaction });

    await CallParticipant.update(
      { leftAt: endedAt, connectionStatus: 'disconnected' },
      { where: { callId }, transaction }
    );

    await createCallActivity(callId, userId, 'call_ended', { duration }, transaction);

    await transaction.commit();

    return { message: 'Call ended', callId, duration };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelCall = async (callId, userId) => {
  const call = await Call.findByPk(callId);

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.callerId !== userId) {
    throw new AppError('Only caller can cancel the call', 403);
  }

  if (call.status !== 'pending' && call.status !== 'ringing') {
    throw new AppError('Call cannot be cancelled', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    await call.update({
      status: 'cancelled',
      endedAt: new Date()
    }, { transaction });

    await CallParticipant.update(
      { leftAt: new Date(), connectionStatus: 'disconnected' },
      { where: { callId }, transaction }
    );

    await createCallActivity(callId, userId, 'call_cancelled', {}, transaction);

    await transaction.commit();

    return { message: 'Call cancelled', callId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getCallById = async (callId, userId) => {
  const call = await Call.findByPk(callId, {
    include: [
      { model: User, as: 'caller', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'callee', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: CallParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }
    ]
  });

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return call;
};

const getUserCallHistory = async (userId, filters = {}) => {
  const where = {
    [Op.or]: [
      { callerId: userId },
      { calleeId: userId }
    ]
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt[Op.gte] = filters.fromDate;
    if (filters.toDate) where.createdAt[Op.lte] = filters.toDate;
  }

  return Call.findAll({
    where,
    include: [
      { model: User, as: 'caller', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'callee', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const updateCallSignaling = async (callId, userId, signalingData) => {
  const call = await Call.findByPk(callId);

  if (!call) {
    throw new AppError('Call not found', 404);
  }

  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return call.update({
    signalingData: { ...call.signalingData, ...signalingData }
  });
};

module.exports = {
  initiateCall,
  answerCall,
  rejectCall,
  endCall,
  cancelCall,
  getCallById,
  getUserCallHistory,
  updateCallSignaling,
  createCallActivity
};