import api from '../axiosInstance';

/**
 * Service Layer สำหรับจัดการ API ของทรัพยากร Room (ห้องประชุมเดิม)
 * API Path: /api/rooms
 */

// ดึงรายการห้องประชุมทั้งหมด
export const getRooms = () => api.get('/rooms');

// ดึงรายละเอียดห้องประชุมตาม ID
export const getRoom = (id) => api.get(`/rooms/${id}`);

// สร้างห้องประชุมใหม่ (Admin Only)
export const createRoom = (data) => api.post('/rooms', data);

// อัปเดตข้อมูลห้องประชุม (Admin Only)
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);

// ลบห้องประชุม (Admin Only)
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);
