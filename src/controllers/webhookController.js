const { Call, GroupCall, GroupCallParticipant, CallActivity, sequelize } = require('../models');
const { Op } = require('sequelize');

const handleParticipantLeft = async (payload) => {
  const { room, participant } = payload;

  // Check if it's a 1-on-1 call room (call_<callId>)
  const callMatch = room.name.match(/^call_(.+)$/);
  if (callMatch) {
    const callId = callMatch[1];
    const userId = participant.identity;

    const call = await Call.findByPk(callId);
    if (!call) return { success: false, message: 'Call not found' };

    const transaction = await sequelize.transaction();
    try {
      await CallParticipant.update(
        { leftAt: new Date(), connectionStatus: 'disconnected' },
        { where: { callId, userId }, transaction }
      );

      await CallActivity.create({
        callId,
        userId,
        activityType: 'participant_left',
        metadata: { participant: participant.identity }
      }, { transaction });

      // Check if both participants left
      const activeParticipants = await CallParticipant.count({
        where: { callId, leftAt: null }
      });

      if (activeParticipants === 0 && call.status !== 'ended') {
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

        await CallActivity.create({
          callId,
          userId,
          activityType: 'call_ended',
          metadata: { duration, reason: 'all_participants_left' }
        }, { transaction });
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Webhook participant_left error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if it's a group call room (task_<taskId>)
  const groupMatch = room.name.match(/^task_(.+)$/);
  if (groupMatch) {
    const taskId = groupMatch[1];
    const userId = participant.identity;

    // Find group call by taskId column
    const groupCall = await GroupCall.findOne({
      where: {
        taskId,
        status: { [Op.in]: ['active', 'scheduled'] }
      }
    });

    if (!groupCall) return { success: false, message: 'Group call not found' };

    const transaction = await sequelize.transaction();
    try {
      await GroupCallParticipant.update(
        { leftAt: new Date(), connectionStatus: 'disconnected' },
        { where: { groupCallId: groupCall.groupCallId, userId }, transaction }
      );

      await CallActivity.create({
        groupCallId: groupCall.groupCallId,
        userId,
        activityType: 'participant_left',
        metadata: { participant: participant.identity }
      }, { transaction });

      // Check if all participants left
      const activeParticipants = await GroupCallParticipant.count({
        where: { groupCallId: groupCall.groupCallId, leftAt: null }
      });

      if (activeParticipants === 0 && groupCall.status !== 'ended') {
        await groupCall.update({
          status: 'ended',
          endedAt: new Date()
        }, { transaction });

        await CallActivity.create({
          groupCallId: groupCall.groupCallId,
          userId,
          activityType: 'call_ended',
          metadata: { reason: 'all_participants_left' }
        }, { transaction });
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Webhook group participant_left error:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, message: 'Unknown room format' };
};

const handleRoomFinished = async (payload) => {
  const { room } = payload;

  // 1-on-1 call room
  const callMatch = room.name.match(/^call_(.+)$/);
  if (callMatch) {
    const callId = callMatch[1];

    const call = await Call.findByPk(callId);
    if (!call || call.status === 'ended') return { success: true };

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
        { where: { callId, leftAt: null }, transaction }
      );

      await CallActivity.create({
        callId,
        userId: call.callerId,
        activityType: 'call_ended',
        metadata: { duration, reason: 'room_finished' }
      }, { transaction });

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Webhook room_finished call error:', error);
      return { success: false, error: error.message };
    }
  }

  // Group call room
  const groupMatch = room.name.match(/^task_(.+)$/);
  if (groupMatch) {
    const taskId = groupMatch[1];

    const groupCall = await GroupCall.findOne({
      where: {
        taskId,
        status: { [Op.in]: ['active', 'scheduled'] }
      }
    });

    if (!groupCall || groupCall.status === 'ended') return { success: true };

    const transaction = await sequelize.transaction();
    try {
      await groupCall.update({
        status: 'ended',
        endedAt: new Date()
      }, { transaction });

      await GroupCallParticipant.update(
        { leftAt: new Date(), connectionStatus: 'disconnected' },
        { where: { groupCallId: groupCall.groupCallId, leftAt: null }, transaction }
      );

      await CallActivity.create({
        groupCallId: groupCall.groupCallId,
        userId: groupCall.hostId,
        activityType: 'call_ended',
        metadata: { reason: 'room_finished' }
      }, { transaction });

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Webhook room_finished group error:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, message: 'Unknown room format' };
};

const webhookHandler = async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log(`LiveKit webhook: ${event}`, JSON.stringify(payload, null, 2));

    let result = { success: false };

    switch (event) {
      case 'participant_left':
        result = await handleParticipantLeft(payload);
        break;
      case 'room_finished':
        result = await handleRoomFinished(payload);
        break;
      case 'participant_joined':
        // Optional: Track when participants join
        console.log('Participant joined:', payload.participant?.identity, 'room:', payload.room?.name);
        result = { success: true };
        break;
      case 'track_published':
        console.log('Track published:', payload.track?.sid, 'by:', payload.participant?.identity);
        result = { success: true };
        break;
      case 'track_unpublished':
        console.log('Track unpublished:', payload.track?.sid, 'by:', payload.participant?.identity);
        result = { success: true };
        break;
      default:
        console.log('Unhandled webhook event:', event);
        result = { success: true, message: 'Event acknowledged' };
    }

    res.json(result);
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  webhookHandler,
  handleParticipantLeft,
  handleRoomFinished,
};