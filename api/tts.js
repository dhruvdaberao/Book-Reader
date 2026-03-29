const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing "text" in request body.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  // Cap at 4096 chars (OpenAI tts-1 limit)
  const input = text.slice(0, 4096);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
    return res.status(200).end(buffer);
  } catch (err) {
    console.error('OpenAI TTS error:', err);
    const message = err?.error?.message || err?.message || 'TTS generation failed';
    return res.status(500).json({ error: message });
  }
};
