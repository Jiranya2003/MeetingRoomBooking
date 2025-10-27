import api from '../axiosInstance';

// ฟังก์ชันสำหรับดึงรายการห้องประชุมใหม่ทั้งหมด
export const getAllMeetingRooms = () => api.get('/meetingrooms');

// ฟังก์ชันสำหรับดึงข้อมูลห้องประชุมใหม่ตาม ID
export const getMeetingRoom = (id) => api.get(`/meetingrooms/${id}`);

// ฟังก์ชันสำหรับสร้างห้องประชุมใหม่ (Admin Only)
export const createMeetingRoom = (data) => api.post('/meetingrooms', data);

// ฟังก์ชันสำหรับอัปเดตข้อมูลห้องประชุม (Admin Only)
export const updateMeetingRoom = (id, data) => api.put(`/meetingrooms/${id}`, data);

// ฟังก์ชันสำหรับลบห้องประชุม (Admin Only)
export const deleteMeetingRoom = (id) => api.delete(`/meetingrooms/${id}`);
