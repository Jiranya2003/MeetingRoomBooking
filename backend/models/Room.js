const db = require('../config/db');

// ตารางและคอลัมน์
const TABLE_NAME = 'rooms';
const ROOM_FIELDS = ['name', 'location', 'capacity', 'description', 'equipment', 'status']; // เพิ่ม 'status'

// -----------------------------------------------------------------
// 1. ดึงข้อมูลห้องทั้งหมด
// -----------------------------------------------------------------
async function getAllRooms() {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} ORDER BY id`);
    return rows;
}

// -----------------------------------------------------------------
// 2. ดึงข้อมูลห้องตาม ID
// -----------------------------------------------------------------
async function getRoomById(id) {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    return rows[0];
}

// -----------------------------------------------------------------
// 3. สร้างห้องใหม่
// -----------------------------------------------------------------
async function createRoom({ name, location, capacity, description, equipment, status = 'available' }) {
    const [res] = await db.query(
        `INSERT INTO ${TABLE_NAME} (name, location, capacity, description, equipment, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, location, capacity, description, equipment, status]
    );
    return res.insertId;
}

// -----------------------------------------------------------------
// 4. อัปเดตห้องประชุม
// -----------------------------------------------------------------
async function updateRoom(id, fields) {
    const keys = Object.keys(fields);
    const filteredKeys = keys.filter(key => ROOM_FIELDS.includes(key));
    const filteredValues = filteredKeys.map(key => fields[key]);

    if (filteredKeys.length === 0) return;

    const setStr = filteredKeys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE ${TABLE_NAME} SET ${setStr} WHERE id = ?`, [...filteredValues, id]);
}

// -----------------------------------------------------------------
// 5. ลบห้องประชุม
// -----------------------------------------------------------------
async function deleteRoom(id) {
    await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
}

// -----------------------------------------------------------------
// 6. ดึงห้องว่างตามช่วงเวลา (ใช้ร่วมกับ Booking)
// -----------------------------------------------------------------
async function getAvailableRooms(date, start_time, end_time) {
    const [rooms] = await db.query(`SELECT * FROM ${TABLE_NAME}`);

    const updatedRooms = await Promise.all(
        rooms.map(async (room) => {
            const [overlapRows] = await db.query(
                `SELECT id FROM bookings 
                 WHERE room_id = ? 
                 AND status IN ('pending', 'confirmed') 
                 AND start_time < ? AND end_time > ?`,
                [room.id, end_time, start_time]
            );

            return {
                ...room,
                status: overlapRows.length > 0 ? 'booked' : 'available'
            };
        })
    );

    return updatedRooms.filter(room => room.status === 'available');
}

// -----------------------------------------------------------------
// 7. อัปเดตสถานะห้องโดยตรง (Optional สำหรับ Scheduler)
// -----------------------------------------------------------------
async function updateRoomStatus(id, status) {
    const [res] = await db.query(`UPDATE ${TABLE_NAME} SET status = ? WHERE id = ?`, [status, id]);
    return res.affectedRows;
}

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    getAvailableRooms,
    updateRoomStatus
};
