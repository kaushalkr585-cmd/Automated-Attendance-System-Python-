import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// ─── Recognition ─────────────────────────────────────────────────────────────
export const recognizeFace = async (imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');
  const { data } = await api.post('/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const markAttendance = async (studentId) => {
  const { data } = await api.post('/mark-attendance', { student_id: studentId });
  return data;
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudents = async () => {
  const { data } = await api.get('/students');
  return data;
};

export const getStudent = async (id) => {
  const { data } = await api.get(`/students/${id}`);
  return data;
};

export const addStudent = async (formData) => {
  const { data } = await api.post('/students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateStudent = async (id, formData) => {
  const { data } = await api.put(`/students/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteStudent = async (id) => {
  const { data } = await api.delete(`/students/${id}`);
  return data;
};

// ─── Encodings ────────────────────────────────────────────────────────────────
export const generateEncodings = async () => {
  const { data } = await api.post('/generate-encodings');
  return data;
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

export default api;
