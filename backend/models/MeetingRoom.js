const db = require('../config/db');

/**
 * Model สำหรับจัดการข้อมูลห้องประชุม (Rooms) ในฐานข้อมูล MySQL
 */

// 1. ดึงรายการห้องประชุมทั้งหมด
async function getAllMeetingRooms() {
    const [rows] = await db.query('SELECT * FROM rooms ORDER BY id');
    return rows;
}

// 2. ดึงข้อมูลห้องประชุมตาม ID
async function getMeetingRoomById(id) {
    const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0];
}

// 3. สร้างห้องประชุมใหม่
async function createMeetingRoom({ name, floor = null, capacity, hasProjector = false, isAvailable = true }) {
    const [res] = await db.query(
        'INSERT INTO rooms (name, floor, capacity, has_projector, is_available) VALUES (?, ?, ?, ?, ?)',
        [name, floor, capacity, hasProjector, isAvailable]
    );
    return res.insertId;
}

// 4. อัปเดตข้อมูลห้องประชุม (Whitelist ป้องกัน SQL Injection)
async function updateMeetingRoom(id, fields) {
    const keys = Object.keys(fields);
    const ALLOWED_FIELDS = ['name', 'floor', 'capacity', 'has_projector', 'is_available'];
    
    const filteredKeys = keys.filter(key => ALLOWED_FIELDS.includes(key));
    const filteredValues = filteredKeys.map(key => fields[key]);

    if (filteredKeys.length === 0) return 0;

    const setStr = filteredKeys.map(k => `${k} = ?`).join(', ');
    const [res] = await db.query(`UPDATE rooms SET ${setStr} WHERE id = ?`, [...filteredValues, id]);
    return res.affectedRows;
}

// 5. ลบห้องประชุม
async function deleteMeetingRoom(id) {
    const [res] = await db.query('DELETE FROM rooms WHERE id = ?', [id]);
    return res.affectedRows;
}

// 6. อัปเดตสถานะ availability ของห้อง
async function setRoomAvailability(id, isAvailable) {
    const [res] = await db.query('UPDATE rooms SET is_available = ? WHERE id = ?', [isAvailable, id]);
    return res.affectedRows;
}

module.exports = { 
    getAllMeetingRooms, 
    getMeetingRoomById, 
    createMeetingRoom, 
    updateMeetingRoom, 
    deleteMeetingRoom,
    setRoomAvailability
};
