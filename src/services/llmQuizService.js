const { getAI, withTimeout } = require('../utils/aiHelper');
const { Type } = require('@google/genai');
const { LlmPromptTemplate, MslqStaticQuestion, UserQuizResult } = require('../models');
const { QueryTypes } = require('sequelize');

// Kategori MSLQ resmi sesuai database & bank soal
const MSLQ_CATEGORIES = [
    'organization',
    'time_management',
    'metacognitive_self_regulation',
    'help_seeking',
    'elaboration',
    'rehearsal'
];

const EXPECTED_TOTAL = 24;
const EXPECTED_PER_CATEGORY = 4;

const PROFILES = {
    organization: 'Anda unggul dalam mengorganisasi materi belajar secara terstruktur dan sistematis.',
    time_management: 'Anda memiliki kemampuan manajemen waktu dan pengaturan prioritas tugas yang baik.',
    metacognitive_self_regulation: 'Anda aktif merencanakan, memantau, dan meregulasi proses pemahaman mandiri.',
    help_seeking: 'Anda proaktif mencari bantuan dan berdiskusi secara efektif saat menemui kesulitan.',
    elaboration: 'Anda mahir mengaitkan materi baru dengan konsep atau pengalaman nyata sebelumnya.',
    rehearsal: 'Anda tekun mengulang, mengingat, dan mempraktikkan materi hingga benar-benar melekat.',
    // Profil alternatif jika dikirim dari Flutter
    planning: 'Anda cenderung merencanakan belajar dengan terstruktur. Kelebihan: terorganisir.',
    monitoring: 'Anda baik memantau pemahaman diri. Kelebihan: sadar kekurangan.',
    controlling: 'Anda mengendalikan fokus & kecepatan belajar. Kelebihan: efisien.',
    reflection: 'Anda mengevaluasi proses & hasil belajar. Kelebihan: terus berkembang.',
    effort: 'Anda punya ketekunan & usaha tinggi. Kelebihan: tangguh.'
};

function shuffleArray(array) {
    if (!Array.isArray(array)) return [];
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Helper normalisasi opsi ke format Map Flutter {"1": "text", "2": "text", "3": "text"}
function formatOptionsToMap(options) {
    if (Array.isArray(options)) {
        return options.reduce((acc, opt) => {
            acc[String(opt.score)] = opt.text;
            return acc;
        }, {});
    }
    return options || {};
}

function validateGeneratedQuestions(questions) {
    const errors = [];
    if (!Array.isArray(questions)) return ['Output bukan array.'];
    if (questions.length !== EXPECTED_TOTAL) errors.push(`Jumlah soal ${questions.length}, harus ${EXPECTED_TOTAL}.`);

    const counts = {};
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!MSLQ_CATEGORIES.includes(q.category)) {
            errors.push(`questions[${i}]: Kategori "${q.category}" invalid.`);
        } else {
            counts[q.category] = (counts[q.category] || 0) + 1;
        }

        if (!Array.isArray(q.options) || q.options.length !== 3) {
            errors.push(`questions[${i}]: Options harus 3.`);
            continue;
        }
        const scores = q.options.map(o => Number(o.score)).sort();
        if (JSON.stringify(scores) !== JSON.stringify([1, 2, 3])) {
            errors.push(`questions[${i}]: Skor options harus [1,2,3].`);
        }
    }
    for (const cat of MSLQ_CATEGORIES) {
        if (counts[cat] !== EXPECTED_PER_CATEGORY) {
            errors.push(`Kategori "${cat}" harus ${EXPECTED_PER_CATEGORY} soal.`);
        }
    }
    return errors;
}

// 1. Generate Pertanyaan Dinamis via LLM Gemini
exports.generateDynamicQuestions = async() => {
    const ai = await getAI();
    const template = await LlmPromptTemplate.findOne({
        where: { templateName: 'mslq_quiz_generator', isActive: true }
    });
    if (!template) throw new Error("Template prompt tidak ditemukan.");

    const responseSchema = {
        type: Type.ARRAY,
        minItems: EXPECTED_TOTAL,
        maxItems: EXPECTED_TOTAL,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING, enum: MSLQ_CATEGORIES },
                question_text: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    minItems: 3,
                    maxItems: 3,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            score: { type: Type.STRING, enum: ["1", "2", "3"] },
                        },
                        required: ['text', 'score'],
                    },
                },
            },
            required: ['category', 'question_text', 'options'],
        },
    };

    const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: template.systemPrompt,
        config: { responseMimeType: "application/json", responseSchema, temperature: 0.8 }
    }), 25000);

    if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new Error('LLM kehabisan token.');
    }

    const questions = JSON.parse(response.text);
    const sanitizedQuestions = questions.map(q => ({
        ...q,
        options: q.options.map(opt => ({...opt, score: parseInt(opt.score, 10) }))
    }));

    const errors = validateGeneratedQuestions(sanitizedQuestions);
    if (errors.length > 0) throw new Error(`LLM output tidak valid: ${errors.join(' | ')}`);

    return sanitizedQuestions.map(q => ({
        ...q,
        options: formatOptionsToMap(q.options)
    }));
};

// 2. Bank Soal Statis Database (Fallback)
exports.getStaticQuestions = async() => {
    const rows = await MslqStaticQuestion.sequelize.query(`
    WITH ranked AS (
      SELECT static_q_id, category, question_text, options,
             ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) AS rn
      FROM mslq_static_questions
    )
    SELECT static_q_id, category, question_text, options
    FROM ranked WHERE rn <= 4 ORDER BY RANDOM()
  `, { type: QueryTypes.SELECT });

    if (!rows || !Array.isArray(rows) || rows.length < EXPECTED_TOTAL) {
        throw new Error(`Bank soal statis kurang dari 24 (ditemukan: ${rows ? rows.length : 0}).`);
    }

    // Normalisasi opsi array dari DB menjadi format Map Flutter
    return rows.map(q => ({
        ...q,
        options: formatOptionsToMap(q.options)
    }));
};

// 3. Kalkulasi Hasil Kuis (Rule-Based Fallback)
exports.calculateRuleBasedResult = async(answers) => {
    const categoryScores = {};
    const categoryCounts = {};

    MSLQ_CATEGORIES.forEach(cat => {
        categoryScores[cat] = 0;
        categoryCounts[cat] = 0;
    });

    const questions = await MslqStaticQuestion.findAll({
        attributes: ['staticQId', 'category']
    });

    const questionCategoryMap = {};
    questions.forEach(q => {
        questionCategoryMap[q.staticQId] = q.category;
    });

    const answerValues = Object.values(answers).map(v => parseInt(v, 10));
    const isScale7 = answerValues.some(val => val > 3);
    const maxScorePerQuestion = isScale7 ? 7 : 3;

    for (const [questionId, selectedOption] of Object.entries(answers)) {
        const category = questionCategoryMap[questionId];
        const score = parseInt(selectedOption, 10);
        if (category && !isNaN(score) && score >= 1) {
            categoryScores[category] = (categoryScores[category] || 0) + score;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
    }

    const ranked = MSLQ_CATEGORIES.map(cat => {
        const rawScore = categoryScores[cat] || 0;
        const count = categoryCounts[cat] || 1;
        const maxPossible = count * maxScorePerQuestion;
        const normalized_score = Math.round((rawScore / maxPossible) * 100) / 100;
        return { category: cat, raw_score: rawScore, normalized_score };
    });

    ranked.sort((a, b) => b.normalized_score - a.normalized_score);

    const dominantStrategy = ranked[0].category;
    const unlockedFeatures = ranked.slice(0, 3).map(r => r.category);
    const lockedFeatures = ranked.slice(3).map(r => r.category);

    return {
        ranked,
        dominant_strategy: dominantStrategy,
        user_profile: PROFILES[dominantStrategy] || 'Profil pembelajar adaptif.',
        unlocked_features: unlockedFeatures,
        locked_features: lockedFeatures,
    };
};

// 4. Simpan Hasil Kuis ke Database
exports.saveQuizResult = async(userId, data) => {
    return UserQuizResult.create({
        userId,
        dominantStrategy: data.dominant_strategy,
        userProfile: data.user_profile,
        unlockedFeatures: data.unlocked_features,
        lockedFeatures: data.locked_features,
        answersPayload: data.answersPayload
    });
};

// 5. Ambil Hasil Kuis Terbaru User
exports.getLatestQuizResult = async(userId) => {
    return UserQuizResult.findOne({
        where: { userId },
        order: [
            ['createdAt', 'DESC']
        ]
    });
};