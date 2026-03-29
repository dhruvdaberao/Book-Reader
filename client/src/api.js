import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const api = axios.create({ baseURL: API_BASE_URL });

/**
 * Upload a book file. Server returns { id, title, totalChapters, chapters[] }.
 */
export const uploadBook = async (file) => {
  const formData = new FormData();
  formData.append('book', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch {
      // no-op: keep fallback message
    }
    throw new Error(message);
  }

  return response.json();
};

/**
 * Generate audio for chapter text.
 */
export const generateTts = async (text) => {
  const response = await api.post('/api/tts', { text }, { responseType: 'arraybuffer' });
  return response.data;
};

export { API_BASE_URL };
export default api;
