// backend/models/bookings.js
const db = require('../config/db');

// -----------------------------------------------------------------
// ค่าคงที่: สถานะที่ถือว่ายังใช้งานอยู่ (จองแล้วหรือกำลังใช้งาน)
// -----------------------------------------------------------------
// ⭐ แก้ไขตรงนี้: เพิ่ม 'PENDING' เพื่อให้การจองที่รออนุมัติถือว่าทับซ้อน
const ACTIVE_STATUSES = ['BOOKED', 'IN_USE', 'PENDING'];

// -----------------------------------------------------------------
// 0. ฟังก์ชันกำหนดสถานะเริ่มต้นตามเวลา (ใช้ซ้ำในการอัปเดตสถานะแบบเรียลไทม์)
// -----------------------------------------------------------------
function determineInitialStatus(start_time, end_time) {
    const now = new Date();
    const start = new Date(start_time);
    const end = new Date(end_time);

    if (end < now) return 'COMPLETED'; // หมดเวลาแล้ว
    if (start <= now && now <= end) return 'IN_USE'; // กำลังใช้งานอยู่
    return 'BOOKED'; // ยังไม่ถึงเวลา เริ่มจองล่วงหน้า
}

// -----------------------------------------------------------------
// 1. ตรวจสอบการจองทับซ้อน (Overlap)
// -----------------------------------------------------------------
async function hasOverlap(room_id, start_time, end_time) {
    // 💡 แก้ไข: นำเงื่อนไข DATE(start_time) = DATE(?) ออก
    // เพื่อให้สามารถตรวจสอบการจองที่คาบเกี่ยวข้ามวันได้อย่างถูกต้อง
    // เงื่อนไข (Existing Start < New End) AND (Existing End > New Start) ก็เพียงพอแล้ว
    const [rows] = await db.query(
        `SELECT id FROM bookings 
         WHERE room_id = ? 
         AND status IN (?) 
         AND (start_time < ? AND end_time > ?) 
         LIMIT 1`,
        [room_id, ACTIVE_STATUSES, end_time, start_time]
    );
    return rows.length > 0;
}

// -----------------------------------------------------------------
// 2. ฟังก์ชันสร้างการจองใหม่
// -----------------------------------------------------------------
async function createBooking({ user_id, room_id, start_time, end_time, status, title = '' }) {
    const initialStatus = status || determineInitialStatus(start_time, end_time);

    const [res] = await db.query(
        `INSERT INTO bookings (user_id, room_id, start_time, end_time, status, title, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [user_id, room_id, start_time, end_time, initialStatus, title]
    );
    return res.insertId;
}

// -----------------------------------------------------------------
// 3. ดึงการจองทั้งหมดของผู้ใช้ (พร้อมอัปเดตสถานะชั่วคราวตามเวลาจริง)
// -----------------------------------------------------------------
async function getBookingsByUser(user_id) {
    const [rows] = await db.query(
        `SELECT b.*, r.name AS room_name 
         FROM bookings b 
         JOIN rooms r ON b.room_id = r.id 
         WHERE b.user_id = ? 
         ORDER BY start_time DESC`,
        [user_id]
    );
    
    // ⭐ เพิ่ม: ประมวลผลสถานะที่ถูกต้องตามเวลาปัจจุบันก่อนส่งคืน
    const bookingsWithCurrentStatus = rows.map(booking => {
        // ใช้ determineInitialStatus เพื่อคำนวณสถานะล่าสุดตามเวลาจริง
        const currentStatus = determineInitialStatus(booking.start_time, booking.end_time);
        
        // คืนค่าอ็อบเจกต์การจองเดิม โดยแทนที่ status ด้วย currentStatus
        return {
            ...booking,
            status: currentStatus // สถานะที่ Front-End ควรใช้
        };
    });
    
    return bookingsWithCurrentStatus;
}

// -----------------------------------------------------------------
// 4. ดึงการจองทั้งหมด (Admin) - เพิ่มการประมวลผลสถานะตามเวลาจริง
// -----------------------------------------------------------------
async function getAllBookings() {
    const [rows] = await db.query(
        `SELECT b.*, 
                 r.name AS room_name, 
                 u.name AS user_name 
          FROM bookings b 
          JOIN rooms r ON b.room_id = r.id 
          JOIN users u ON b.user_id = u.id 
          ORDER BY start_time DESC`
    );

    // ⭐ เพิ่ม: ประมวลผลสถานะที่ถูกต้องตามเวลาปัจจุบันก่อนส่งคืน
    const bookingsWithCurrentStatus = rows.map(booking => {
        const currentStatus = determineInitialStatus(booking.start_time, booking.end_time);
        
        return {
            ...booking,
            status: currentStatus
        };
    });

    return bookingsWithCurrentStatus;
}

// -----------------------------------------------------------------
// 5. ดึงการจองตามห้องและวันที่
// -----------------------------------------------------------------
async function getExistingBookingsByRoomAndDate(room_id, date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const [rows] = await db.query(
        `SELECT id, start_time, end_time, status, user_id, room_id, title
         FROM bookings
         WHERE room_id = ?
         AND start_time BETWEEN ? AND ?
         ORDER BY start_time ASC`,
        [room_id, startOfDay, endOfDay]
    );
    return rows;
}

// -----------------------------------------------------------------
// 6. ฟังก์ชันอัปเดตสถานะการจอง
// -----------------------------------------------------------------
async function updateBookingStatus(id, status) {
    const [res] = await db.query(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
    );
    return res.affectedRows;
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
    const [rows] = await db.query(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
    );
    return rows[0];
}

// -----------------------------------------------------------------
// 9. ตรวจสอบว่าสามารถยกเลิกได้หรือไม่ (ก่อนเวลาเริ่มอย่างน้อย 15 นาที)
// -----------------------------------------------------------------
function canCancelBooking(booking) {
    const now = new Date();
    const start = new Date(booking.start_time);
    const diffMs = start - now;
    const MIN_CANCEL_BEFORE_MS = 15 * 60 * 1000; // 15 นาที

    if (booking.status === 'COMPLETED' || booking.status === 'IN_USE') return false;
    return diffMs > MIN_CANCEL_BEFORE_MS;
}

// -----------------------------------------------------------------
// 10. Scheduler: อัปเดตสถานะอัตโนมัติ
// -----------------------------------------------------------------
async function updateBookingStatusAuto() {
    const [bookings] = await db.query(
        `SELECT id, start_time, end_time, status FROM bookings`
    );

    const now = new Date();

    for (const booking of bookings) {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        let newStatus = null;

        if (end < now) newStatus = 'COMPLETED';
        else if (start <= now && now <= end) newStatus = 'IN_USE';
        else if (start > now) newStatus = 'BOOKED';

        if (newStatus && newStatus !== booking.status) {
            await db.query(
                'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
                [newStatus, booking.id]
            );
        }
    }
}

// -----------------------------------------------------------------
// 11. อัปเดตรายละเอียดการจอง (หัวข้อ, เวลาเริ่มต้น/สิ้นสุด)
// -----------------------------------------------------------------
async function updateBookingDetails(id, { start_time, end_time, title }) {
    // 1. คำนวณสถานะใหม่
    const newStatus = determineInitialStatus(start_time, end_time);

    // 2. เตรียม Query และ Parameters
    const fields = [];
    const params = [];

    if (start_time) {
        fields.push('start_time = ?');
        params.push(start_time);
    }
    if (end_time) {
        fields.push('end_time = ?');
        params.push(end_time);
    }
    if (title !== undefined) {
        fields.push('title = ?');
        params.push(title);
    }
    
    // สถานะถูกคำนวณใหม่เสมอหากมีการอัปเดตเวลา
    fields.push('status = ?');
    params.push(newStatus);
    
    // Updated at
    fields.push('updated_at = NOW()');

    if (fields.length === 0) return 0; // ไม่มีอะไรให้อัปเดต

    // 3. รัน Query
    const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    const [res] = await db.query(query, params);
    return res.affectedRows;
}

// -----------------------------------------------------------------
// 12. ตรวจสอบความเป็นเจ้าของของการจอง
// -----------------------------------------------------------------
async function isBookingOwner(id, user_id) {
    const [rows] = await db.query(
        'SELECT id FROM bookings WHERE id = ? AND user_id = ? LIMIT 1',
        [id, user_id]
    );
    return rows.length > 0;
}


// -----------------------------------------------------------------
// EXPORT MODULE
// -----------------------------------------------------------------
module.exports = {
    hasOverlap,
    createBooking,
    getBookingsByUser,
    getAllBookings,
    getExistingBookingsByRoomAndDate,
    updateBookingStatus,
    deleteBooking,
    getBookingById,
    updateBookingStatusAuto,
    canCancelBooking,
    determineInitialStatus,
    // ฟังก์ชันที่เพิ่มใหม่
    updateBookingDetails,
    isBookingOwner
};