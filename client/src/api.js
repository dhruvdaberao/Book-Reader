import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

export const uploadBook = async (file) => {
  const formData = new FormData();
  formData.append('book', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getChapters = async (bookId) => {
  const response = await api.get(`/book/${bookId}/chapters`);
  return response.data;
};

export const getStreamUrl = (bookId, chapterIndex) => {
  return `http://localhost:3001/api/stream/${bookId}/${chapterIndex}`;
};

export default api;
