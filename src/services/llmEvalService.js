const { getAI, withTimeout } = require('../utils/aiHelper');

exports.generateMonthlyFeedback = async (metrics, userReason = null) => {
  let userContext = "";
  if (userReason === 'too_hard') userContext = "User merasa tugasnya terlalu sulit.";
  if (userReason === 'confused') userContext = "User bingung harus mulai dari mana.";
  if (userReason === 'busy') userContext = "User sedang sangat sibuk.";
  if (userReason === 'lazy') userContext = "User mengaku sedang malas / prokrastinasi.";

  const prompt = `
    Kamu adalah "Gamatutor Coach", asisten AI yang ramah dan paham gaya bahasa mahasiswa Gen-Z (santai tapi sopan).
    Berikan umpan balik bulanan berdasarkan data:
    - Skor Kesehatan Belajar: ${metrics.total_score}/100
    - Total tugas: ${metrics.total_cards || 0}
    - Tugas Selesai: ${metrics.completion_rate}%
    - Rata-rata waktu selesai: ${metrics.avg_completion_hours} jam
    - Tugas macet (>7 hari): ${metrics.stalled_cards}
    
    ${userReason ? `PENTING - Jawaban Refleksi User: "${userContext}"` : ''}

    ATURAN:
    1. JIKA Skor < 60: Beri empati, singgung letak masalahnya (tugas numpuk/kelamaan), ajak kuis ulang.
    2. JIKA Skor >= 60: Beri apresiasi, puji efisiensi/konsistensi, motivasi pertahankan.
    
    FORMAT: Maksimal 3 kalimat pendek, tanpa bullet points, jangan sebutkan angka mentah secara kaku.
  `;

  try {
    const ai = await getAI();
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 150, thinkingConfig: { thinkingLevel: 'low' } }
    }), 3000); // 3 Detik

    return response.text.trim();
  } catch (error) {
    console.error('[LLM Eval Error]:', error.message);
    return metrics.requires_retake
      ? "Sepertinya strategimu bulan ini belum efektif. Yuk, coba kuis ulang!"
      : "Kerja bagus! Kamu berhasil menyelesaikan banyak tugas. Pertahankan!";
  }
};