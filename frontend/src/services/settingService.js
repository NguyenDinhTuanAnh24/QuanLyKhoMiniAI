import api from './api';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

export const uploadStoreLogo = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
