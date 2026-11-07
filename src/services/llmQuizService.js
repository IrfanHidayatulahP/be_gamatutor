const { getAI, withTimeout } = require('../utils/aiHelper');
const { Type } = require('@google/genai');
const { LlmPromptTemplate, MslqStaticQuestion } = require('../models');
const { QueryTypes } = require('sequelize');

const MSLQ_CATEGORIES = ['organization', 'time_management', 'metacognitive_self_regulation', 'help_seeking', 'elaboration', 'rehearsal'];
const EXPECTED_TOTAL = 24;
const EXPECTED_PER_CATEGORY = 4;

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function validateGeneratedQuestions(questions) {
  const errors = [];
  if (!Array.isArray(questions)) return ['Output bukan array.'];
  if (questions.length !== EXPECTED_TOTAL) errors.push(`Jumlah soal ${questions.length}, harus ${EXPECTED_TOTAL}.`);

  const counts = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!MSLQ_CATEGORIES.includes(q.category)) errors.push(`questions[${i}]: Kategori "${q.category}" invalid.`);
    else counts[q.category] = (counts[q.category] || 0) + 1;

    if (!Array.isArray(q.options) || q.options.length !== 3) {
      errors.push(`questions[${i}]: Options harus 3.`); continue;
    }
    const scores = q.options.map(o => o.score).sort();
    if (JSON.stringify(scores) !== JSON.stringify([1, 2, 3])) {
      errors.push(`questions[${i}]: Skor options harus [1,2,3].`);
    }
  }
  for (const cat of MSLQ_CATEGORIES) {
    if (counts[cat] !== EXPECTED_PER_CATEGORY) errors.push(`Kategori "${cat}" harus ${EXPECTED_PER_CATEGORY} soal.`);
  }
  return errors;
}

exports.generateDynamicQuestions = async () => {
  const ai = await getAI();
  const template = await LlmPromptTemplate.findOne({ where: { templateName: 'mslq_quiz_generator', isActive: true } });
  if (!template) throw new Error("Template prompt tidak ditemukan.");

  const responseSchema = {
    type: Type.ARRAY,
    minItems: EXPECTED_TOTAL, maxItems: EXPECTED_TOTAL,
    items: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: MSLQ_CATEGORIES },
        question_text: { type: Type.STRING },
        options: {
          type: Type.ARRAY, minItems: 3, maxItems: 3,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              score: { type: Type.INTEGER, enum: [1, 2, 3] },
            },
            required: ['text', 'score'],
          },
        },
      },
      required: ['category', 'question_text', 'options'],
    },
  };

  const response = await withTimeout(ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: template.systemPrompt,
    config: { responseMimeType: "application/json", responseSchema, temperature: 0.8 }
  }), 15000); // 15 Detik

  if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new Error('LLM kehabisan token.');

  const questions = JSON.parse(response.text);
  const errors = validateGeneratedQuestions(questions);
  if (errors.length > 0) throw new Error(`LLM output tidak valid: ${errors.join(' | ')}`);

  return questions.map(q => ({ ...q, options: shuffleArray(q.options) }));
};

exports.getStaticQuestions = async () => {
  const rows = await MslqStaticQuestion.sequelize.query(`
    WITH ranked AS (
      SELECT static_q_id, category, question_text, options,
             ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) AS rn
      FROM mslq_static_questions
    )
    SELECT static_q_id, category, question_text, options
    FROM ranked WHERE rn <= 4 ORDER BY RANDOM()
  `, { type: QueryTypes.SELECT });

  if (rows.length < EXPECTED_TOTAL) throw new Error('Bank soal kurang dari 24.');
  return rows.map(q => ({ ...q, options: shuffleArray(q.options) }));
};