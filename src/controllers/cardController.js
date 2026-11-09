const {
    createCard,
    getCardById,
    updateCard,
    deleteCard,
    getUserCards
} = require('../services/cardService');

const { Card, CardListCollab, User, Notification } = require('../models');
const { getIo } = require('../websocket/ioInstance');
const { sendPushToUser } = require('../services/notificationService');


const createNewCard = async(req, res, next) => {
    try {
        const card = await createCard(req.user.userId, req.body);
        res.status(201).json({ card });
    } catch (error) {
        next(error);
    }
};

const getCard = async(req, res, next) => {
    try {
        const card = await getCardById(req.params.id, req.user.userId);
        res.json({ card });
    } catch (error) {
        next(error);
    }
};

const updateExistingCard = async(req, res, next) => {
    try {
        const card = await updateCard(req.params.id, req.user.userId, req.body);
        res.json({ card });
    } catch (error) {
        next(error);
    }
};

const deleteExistingCard = async(req, res, next) => {
    try {
        await deleteCard(req.params.id, req.user.userId);
        res.json({ message: 'Card deleted' });
    } catch (error) {
        next(error);
    }
};

const getCards = async(req, res, next) => {
    try {
        console.time('GetCardsDuration');
        const cards = await getUserCards(req.user.userId, req.query);
        console.timeEnd('GetCardsDuration');
        res.json({ cards });
    } catch (error) {
        next(error);
    }
};

// 1. Fungsi untuk meminta izin sesi fokus
const requestFocusSession = async (req, res, next) => {
  try {
    const { id: cardId } = req.params;
    const requesterId = req.user.userId;

    const card = await Card.findByPk(cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const collabs = await CardListCollab.findAll({ where: { cardId } });
    const otherCollabs = collabs.filter(c => c.userId !== requesterId);

    const io = getIo();
    if (otherCollabs.length > 0) {
      const requester = await User.findByPk(requesterId, { attributes: ['firstName', 'username'] });
      const requesterName = requester.firstName || requester.username;

      // Looping setiap kolaborator
      for (const collab of otherCollabs) {
        // 1. Simpan ke database Notifikasi
        await Notification.create({
          userId: collab.userId,
          type: 'push',
          title: 'Permintaan Sesi Fokus',
          message: `${requesterName} ingin memulai sesi fokus untuk tugas "${card.title}". Apakah Anda setuju?`,
          triggerAction: 'focus_request_received',
          referenceId: cardId,
          triggerUserId: requesterId,
          delivered: true, // Anggap terkirim
          sentAt: new Date()
        });

        // 2. Kirim WebSocket (jika user sedang buka aplikasi)
        if (io) {
          io.emitToUser(collab.userId, 'focus:request_received', {
            cardId: cardId,
            cardTitle: card.title,
            requesterId: requesterId,
            requesterName: requesterName,
          });
        }

        // 3. Kirim FCM Push Notification (jika aplikasi di background/tertutup)
        try {
          await sendPushToUser(collab.userId, 'Permintaan Sesi Fokus', `${requesterName} ingin memulai sesi fokus.`, {
            type: 'focus_request_received',
            cardId: cardId,
            requesterName: requesterName,
          });
        } catch (fcmError) {
          console.error('FCM focus request failed:', fcmError);
        }
      }

      return res.status(200).json({ 
        message: 'Menunggu persetujuan kolaborator...', 
        waiting: true 
      });
    }

    return res.status(200).json({ message: 'Tidak ada kolaborator, lanjutkan', waiting: false });
  } catch (error) {
    console.error('Error requestFocusSession:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Fungsi untuk merespons permintaan sesi fokus
const respondFocusSession = async (req, res, next) => {
  try {
    const { id: cardId } = req.params;
    const { action } = req.body; // 'accept' atau 'reject'
    const responderId = req.user.userId;

    const card = await Card.findByPk(cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const responder = await User.findByPk(responderId, { attributes: ['firstName', 'username'] });
    const responderName = responder.firstName || responder.username;

    const io = getIo();
    if (io) {
      io.emitToUser(card.userId, action === 'accept' ? 'focus:approved' : 'focus:rejected', {
        cardId: cardId,
        responderName: responderName,
      });
    }

    res.status(200).json({ success: true, action });
  } catch (error) {
    console.error('Error respondFocusSession:', error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Jangan lupa ekspor fungsi barunya
module.exports = {
    createNewCard,
    getCard,
    getCards,
    updateExistingCard,
    deleteExistingCard,
    requestFocusSession,
    respondFocusSession
};
