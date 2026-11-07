'use strict';
const express = require('express');
const llm = require('../services/llmMicroGoalsService');
const { HttpError, bad, newId, nowIso, wrap, userId, countWords, str, int } = require('../utils/llmMicroUtils');
const { serializeSession } = require('../utils/serializeLlmGoals');

const MIN_WORDS = 5;
const MAX_WORDS = 100;
const ALREADY_DONE = "Micro-goal sudah selesai. Gunakan 'Ubah' untuk membuat percobaan baru.";

module.exports = function microGoalRoutes({ MicroGoalSession }) {
  const router = express.Router();

  async function load(id, uid) {
    const row = await MicroGoalSession.findOne({ where: { id, user_id: uid } });
    if (!row) throw new HttpError(404, 'Sesi micro-goal tidak ditemukan.');
    return row;
  }

  // Langkah 1: buat sesi + simpan keyakinan awal (tugas belum tersimpan, jadi konteksnya di-snapshot).
  router.post('/', wrap(async (req, res) => {
    const uid = userId(req);
    const b = req.body || {};
    const course = str(b, 'course', { min: 1, max: 100, label: 'Mata kuliah' });
    const taskTitle = str(b, 'task_title', { min: 1, max: 200, label: 'Judul tugas' });
    const taskDescription = str(b, 'task_description', { max: 1000, required: false, label: 'Deskripsi' });
    const learningGoal = str(b, 'learning_goal', { max: 300, required: false, label: 'Tujuan belajar' });
    const initial = int(b, 'initial_confidence', { min: 0, max: 100, label: 'Keyakinan awal' });
    const prevId = b.previous_session_id || null;

    let attemptNo = 1;
    if (prevId) attemptNo = (await load(String(prevId), uid)).attempt_no + 1;

    const ts = nowIso();
    const row = await MicroGoalSession.create({
      id: newId(), user_id: uid, previous_session_id: prevId, attempt_no: attemptNo,
      course, task_title: taskTitle, task_description: taskDescription, learning_goal: learningGoal,
      initial_confidence: initial, status: 'started', created_at: ts, updated_at: ts
    });
    res.status(201).json(serializeSession(row));
  }));

  router.get('/:id', wrap(async (req, res) => {
    res.json(serializeSession(await load(req.params.id, userId(req))));
  }));

  // Kembali ke langkah 1 dan ubah slider.
  router.patch('/:id', wrap(async (req, res) => {
    const uid = userId(req);
    const row = await load(req.params.id, uid);
    const initial = int(req.body || {}, 'initial_confidence', { min: 0, max: 100, label: 'Keyakinan awal' });
    if (row.status === 'completed') throw new HttpError(409, ALREADY_DONE);
    await row.update({ initial_confidence: initial, updated_at: nowIso() });
    res.json(serializeSession(row));
  }));

  // Langkah 2 -> 3: validasi teks di server, jalankan analisis, simpan hasilnya.
  router.post('/:id/articulation', wrap(async (req, res) => {
    const uid = userId(req);
    const row = await load(req.params.id, uid);
    const text = str(req.body || {}, 'text', { min: 1, max: 2000, label: 'Teks' });
    if (row.status === 'completed') throw new HttpError(409, ALREADY_DONE);

    const words = countWords(text);
    if (words < MIN_WORDS) throw bad(`Tulis minimal ${MIN_WORDS} kata agar bisa dianalisis.`);
    if (words > MAX_WORDS) throw bad(`Maksimal ${MAX_WORDS} kata (sekarang ${words} kata).`);

    const out = await llm.analyze({
      courseName: row.course, taskTitle: row.task_title,
      taskDescription: row.task_description, learningGoal: row.learning_goal
    }, text);
    const a = out.analysis;
    await row.update({
      articulation_text: text, word_count: words,
      ai_insight: a.insight, ai_reason: a.reason, ai_recommended_difficulty: a.recommendedDifficulty,
      ai_analysis: JSON.stringify({
        concept_coverage: a.conceptCoverage, concept_accuracy: a.conceptAccuracy,
        key_elements: a.keyElements, knowledge_gaps: a.knowledgeGaps
      }),
      analysis_source: out.source, llm_model: out.model, prompt_version: out.promptVersion,
      latency_ms: out.latencyMs, revised_confidence: null, confidence_delta: null,
      status: 'analyzed', updated_at: nowIso()
    });
    res.json(serializeSession(row));
  }));

  // Langkah 4: simpan keyakinan revisi. Hanya selisih angka (tanpa label overconfident/underconfident).
  router.post('/:id/complete', wrap(async (req, res) => {
    const uid = userId(req);
    const row = await load(req.params.id, uid);
    const revised = int(req.body || {}, 'revised_confidence', { min: 0, max: 100, label: 'Keyakinan revisi' });
    if (row.status !== 'analyzed') throw new HttpError(409, 'Selesaikan langkah analisis lebih dulu.');
    const ts = nowIso();
    await row.update({
      revised_confidence: revised, confidence_delta: revised - row.initial_confidence,
      status: 'completed', completed_at: ts, updated_at: ts
    });
    res.json(serializeSession(row));
  }));

  return router;
};
