const {
    createActivityLog,
    getAllActivityLogs,
    getActivityLogById,
    getActivityLogsByUser,
    getActivityLogsByType,
    deleteActivityLog
} = require('../services/userActivityLogService');

const formatLogs = (logs) => {
    return logs.map(log => {
        const plain = log.toJSON();

        // 1. Ambil Nama User (dari relasi 'user')
        let userName = 'Seseorang';
        if (plain.user) {
            const fName = plain.user.firstName || '';
            const lName = plain.user.lastName || '';
            const uName = plain.user.username || '';
            if (fName || lName) {
                userName = `${fName} ${lName}`.trim();
            } else if (uName) {
                userName = uName;
            }
        }

        // 2. Ambil Judul & Deskripsi
        // Kita cek apakah ada di metadata, kalau tidak ada kita buat manual dari activityType
        let title = plain.metadata?.title || '';
        let desc = plain.metadata?.description || '';

        if (!title) {
            // Ubah snake_case jadi Title Case (misal: "card_created" -> "Card Created")
            const rawType = plain.activityType || 'Aktivitas';
            title = rawType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        // 3. Gabungkan Judul dengan Nama User
        const displayTitle = `${title} • ${userName}`;

        return {
            ...plain,
            title: displayTitle, // Kirim string yang sudah digabung ke Flutter
            description: desc,
            user: plain.user
        };
    });
};

const create = async(req, res, next) => {
    try {
        const log = await createActivityLog(req.user.userId, req.body);
        res.status(201).json({ activityLog: log });
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
    try {
        const filters = {
            userId: req.query.userId,
            activityType: req.query.activityType,
            refId: req.query.refId,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };
        const logs = await getAllActivityLogs(filters);
        res.json({ activityLogs: logs });
    } catch (error) {
        next(error);
    }
};

const getById = async(req, res, next) => {
    try {
        const log = await getActivityLogById(req.params.id);
        res.json({ activityLog: log });
    } catch (error) {
        next(error);
    }
};

const getByUser = async(req, res, next) => {
    try {
        const filters = {
            activityType: req.query.activityType,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };
        const logs = await getActivityLogsByUser(req.params.userId, filters);
        res.json({ activityLogs: logs });
    } catch (error) {
        next(error);
    }
};

const getByType = async(req, res, next) => {
    try {
        const filters = {
            userId: req.query.userId,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };
        const logs = await getActivityLogsByType(req.params.activityType, filters);
        res.json({ activityLogs: logs });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await deleteActivityLog(req.params.id);
        res.json({ message: 'Activity log deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, getAll, getById, getByUser, getByType, remove };