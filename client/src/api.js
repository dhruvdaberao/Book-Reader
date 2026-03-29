import axios from 'axios';

// Relative base URL — works on Vercel (/api/*) and locally via Vite proxy
const api = axios.create({ baseURL: '/api' });

/**
 * Upload a book file. Server returns { id, title, totalChapters, chapters[] }.
 */
export const uploadBook = async (file) => {
  const formData = new FormData();
  formData.append('book', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Call OpenAI TTS and return an ArrayBuffer of MP3 audio.
 */
export const generateTts = async (text) => {
  const response = await api.post('/tts', { text }, { responseType: 'arraybuffer' });
  return response.data;
};

export default api;
