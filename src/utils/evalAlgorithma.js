const evaluatePerformance = (cards) => {
  const totalCards = cards.length;

  if (totalCards === 0) {
    return {
      total_score: 0, completion_rate: 0, avg_completion_hours: 0,
      stalled_cards: 0, requires_retake: true,
    };
  }

  // A. Completion Rate
  const completedCards = cards.filter(c => c.reflectionCompletedAt !== null);
  const completionRate = (completedCards.length / totalCards) * 100;

  // B. Rata-rata Waktu (Jam)
  let totalHours = 0;
  completedCards.forEach(card => {
    const start = card.startTime ? new Date(card.startTime) : new Date(card.createdAt);
    const end = card.reflectionCompletedAt ? new Date(card.reflectionCompletedAt) : new Date();
    const diffHours = (end - start) / (1000 * 60 * 60);
    totalHours += Math.max(0, diffHours);
  });
  const avgCompletionHours = completedCards.length > 0 ? (totalHours / completedCards.length) : 0;

  // C. Stalled Cards (Macet > 7 hari)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const stalledCards = cards.filter(c => 
    c.reflectionCompletedAt === null && new Date(c.createdAt) < sevenDaysAgo
  ).length;

  // Konversi ke Skor (0-100)
  const scoreCompletion = completionRate; 
  let scoreTime = 30;
  if (avgCompletionHours <= 24) scoreTime = 100;
  else if (avgCompletionHours <= 48) scoreTime = 80;
  else if (avgCompletionHours <= 72) scoreTime = 60;
  
  const scoreConsistency = Math.max(0, 100 - (stalledCards * 20));

  // Weighted Scoring
  const totalScore = Math.round(
    (scoreCompletion * 0.5) + (scoreTime * 0.3) + (scoreConsistency * 0.2)
  );

  return {
    total_score: totalScore,
    completion_rate: Math.round(completionRate),
    avg_completion_hours: Math.round(avgCompletionHours),
    stalled_cards: stalledCards,
    requires_retake: totalScore < 60,
  };
};

module.exports = { evaluatePerformance };