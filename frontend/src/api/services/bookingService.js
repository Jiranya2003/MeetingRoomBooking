import api from '../axiosInstance'; // 💡 สมมติว่าไฟล์ axiosInstance.js อยู่ในโฟลเดอร์แม่

/**
 * Service Layer สำหรับจัดการ API ของทรัพยากร Booking (การจอง)
 * API Path: /api/bookings
 */

// 1. สร้างรายการจองใหม่ (POST /api/bookings)
export const createBooking = (data) => api.post('/bookings', data);

// 2. ดึงรายการจองของฉัน (GET /api/bookings/my-bookings)
// เราใช้ /my ตามที่ปรับปรุงใน routes
export const getMyBookings = () => api.get('/bookings/my-bookings');

// 3. ดึงรายการจองทั้งหมด (สำหรับ Admin) (GET /api/bookings)
export const getAllBookings = () => api.get('/bookings');

/**
 * 4. อัปเดตสถานะการจอง (สำหรับ Admin) 
 * PATCH /api/bookings/:id/status
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
    // 💡 การใช้ { params: { room_id, date } } เป็นวิธีมาตรฐานของ Axios ที่ถูกต้อง
    return api.get(`/bookings/available`, {
        params: { room_id, date }
    });
};

// 7. ดึงรายละเอียดการจองตาม ID
export const getBooking = (id) => api.get(`/bookings/${id}`);

// 8. อัปเดตข้อมูลการจอง (ยกเว้นสถานะ)
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);