const { getAI, withTimeout } = require('../utils/aiHelper');

exports.generateFirstFeedback = async (dominantStrategy, userProfile) => {
  try {
    const ai = await getAI();
    const prompt = `
      Kamu adalah pakar Psikometri MSLQ. Berikan saran singkat, ramah, bahasa Gen-Z (maks 2 kalimat).
      - Strategi Dominan: ${dominantStrategy}
      - Profil Belajar: ${userProfile}
      Fokuskan saran pada eksekusi tugas harian menggunakan Kanban board.
    `;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 100, thinkingConfig: { thinkingLevel: 'low' } }
    }), 3000); // 3 Detik

    return response.text.trim();
  } catch (error) {
    console.error('[LLM Rec Error]:', error.message);
    return `Gunakan strategi ${dominantStrategy} untuk memecah tugas besar menjadi sub-tugas kecil di Kanban board.`;
  }
};