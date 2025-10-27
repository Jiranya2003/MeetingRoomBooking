const db = require('../config/db');

// ✅ สถานะที่ถือว่ามีการจองและบล็อกเวลาไม่ให้จองซ้ำ
const ACTIVE_STATUSES = ['pending', 'confirmed']; 

/**
 * Model สำหรับจัดการข้อมูลการจอง (Bookings) ในฐานข้อมูล MySQL
 */

// -----------------------------------------------------------------
// 1. ตรวจสอบการทับซ้อน (Overlap Check)
// -----------------------------------------------------------------
async function hasOverlap(room_id, start_time, end_time) {
    const [rows] = await db.query(
        `SELECT id FROM bookings 
         WHERE room_id = ? 
         AND status IN (?) 
         AND ( (start_time < ?) AND (end_time > ?)) 
         LIMIT 1`,
        [room_id, ACTIVE_STATUSES, end_time, start_time] 
    );
    return rows.length > 0;
}

// -----------------------------------------------------------------
// 2. สร้างรายการจองใหม่
// -----------------------------------------------------------------
async function createBooking({ user_id, room_id, start_time, end_time, status = 'pending' }) {
    const [res] = await db.query(
        'INSERT INTO bookings (user_id, room_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)', 
        [user_id, room_id, start_time, end_time, status]
    );
    return res.insertId;
}

// -----------------------------------------------------------------
// 3. ดึงรายการจองของผู้ใช้ (สำหรับ MyBookingsPage)
// -----------------------------------------------------------------
async function getBookingsByUser(user_id) {
    const [rows] = await db.query(
        'SELECT b.*, r.name AS room_name FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.user_id = ? ORDER BY start_time DESC', 
        [user_id]
    );
    return rows;
}

// -----------------------------------------------------------------
// 4. ดึงรายการจองทั้งหมด (สำหรับ AdminDashboard)
// -----------------------------------------------------------------
async function getAllBookings() {
    const [rows] = await db.query(
        'SELECT b.*, r.name AS room_name, u.name AS user_name FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN users u ON b.user_id = u.id ORDER BY start_time DESC'
    );
    return rows;
}

// -----------------------------------------------------------------
// 5. ดึงข้อมูลการจองที่มีอยู่แล้ว (สำหรับหน้า Calendar/Time Slot Grid)
// -----------------------------------------------------------------
async function getExistingBookingsByRoomAndDate(room_id, date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const [rows] = await db.query(
        // 🚨 แก้ไข: ลบคอลัมน์ 'title' ออกเพื่อแก้ไข Error 1054
        `SELECT id, start_time, end_time, status, user_id, room_id 
         FROM bookings 
         WHERE room_id = ? 
         AND status IN ('pending', 'confirmed', 'completed', 'cancelled') 
         AND start_time BETWEEN ? AND ?
         ORDER BY start_time ASC`,
        [room_id, startOfDay, endOfDay]
    );
    return rows;
}

// -----------------------------------------------------------------
// 6. อัปเดตสถานะการจอง (สำคัญสำหรับการอนุมัติ/เสร็จสิ้น)
// -----------------------------------------------------------------
async function updateBookingStatus(id, status) {
    const [res] = await db.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [status, id]
    );
    return res.affectedRows; // ส่งจำนวนแถวที่ได้รับผลกระทบกลับไป
}

// -----------------------------------------------------------------
// 7. ลบการจอง
// -----------------------------------------------------------------
async function deleteBooking(id) {
    await db.query('DELETE FROM bookings WHERE id = ?', [id]);
}

// -----------------------------------------------------------------
// 8. ดึงข้อมูลการจองตาม ID
// -----------------------------------------------------------------
async function getBookingById(id) {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    return rows[0];
}


module.exports = {
    hasOverlap,
    createBooking,
    getBookingsByUser,
    getAllBookings,
    getExistingBookingsByRoomAndDate,
    updateBookingStatus, 
    deleteBooking,
    getBookingById 
};