import { api } from '../axios';

export const uploadApi = {
  uploadImage: (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ data: { url: string } }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data.url);
  },
};
