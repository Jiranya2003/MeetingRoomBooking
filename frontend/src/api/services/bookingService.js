import api from '../axiosInstance'; // 💡 สมมติว่าไฟล์ axiosInstance.js อยู่ในโฟลเดอร์แม่

// 1. สร้างรายการจองใหม่ (POST /api/bookings)
export const createBooking = (data) => api.post('/bookings', data);

// 2. ดึงรายการจองของฉัน (GET /api/bookings/my-bookings)
// เราใช้ /my ตามที่ปรับปรุงใน routes
export const getMyBookings = () => api.get('/bookings/my-bookings');

// 3. ดึงรายการจองทั้งหมด (สำหรับ Admin) (GET /api/bookings)
export const getAllBookings = () => api.get('/bookings');

/**
 * 4. อัปเดตสถานะการจอง (สำหรับ Admin) 
 * @param {number} id - ID ของการจอง
 * @param {string} status - สถานะใหม่ (เช่น 'confirmed', 'cancelled', 'completed')
 */
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });

// 5. ลบ/ยกเลิกการจอง (DELETE /api/bookings/:id)
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

/**
 * 6. ดึงข้อมูลการจองที่มีอยู่แล้วสำหรับวันที่และห้องที่กำหนด (สำหรับแสดงปฏิทิน/ความพร้อมใช้งาน)
 * GET /api/bookings/available?room_id=...&date=...
 * @param {object} params - พารามิเตอร์รวมถึง room_id และ date
 */
export const getExistingBookingsByRoomAndDate = ({ room_id, date }) => {
    return api.get(`/bookings/available`, {
        params: { room_id, date }
    });
};

// 💡 หากคุณมี service สำหรับ Rooms แยกต่างหาก คุณอาจต้องสร้างไฟล์ roomService.js
// แต่หากคุณรวมไว้ในไฟล์นี้ ก็สามารถเพิ่มฟังก์ชันที่เกี่ยวข้องกับ Rooms เข้าไปได้
// เช่น:
// export const getRooms = () => api.get('/rooms');