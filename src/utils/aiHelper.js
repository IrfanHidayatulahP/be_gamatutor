let _genaiPromise;
function getGenAI() {
  if (!_genaiPromise) _genaiPromise = import('@google/genai');
  return _genaiPromise;
}

let _aiPromise;
function getAI() {
  if (!_aiPromise) {
    _aiPromise = (async () => {
      const { GoogleGenAI } = await getGenAI();
      return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    })();
  }
  return _aiPromise;
}

// Mencegah server stuck jika API Google lambat
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout: LLM Terlalu Lama')), ms)
  );
  return Promise.race([promise, timeout]);
};

module.exports = { getAI, withTimeout };