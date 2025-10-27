const db = require('../config/db');

/**
 * Model สำหรับจัดการข้อมูลห้องประชุม (Rooms) ในฐานข้อมูล MySQL
 */

// 1. ดึงรายการห้องประชุมทั้งหมด
async function getAllMeetingRooms() {
    // 🎯 แก้ไข: ใช้ตาราง 'rooms'
    const [rows] = await db.query('SELECT * FROM rooms ORDER BY id');
    return rows;
}

// 2. ดึงข้อมูลห้องประชุมตาม ID
async function getMeetingRoomById(id) {
    // 🎯 แก้ไข: ใช้ตาราง 'rooms'
    const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0];
}

// 3. สร้างห้องประชุมใหม่
async function createMeetingRoom({ name, floor, capacity, hasProjector, isAvailable }) {
    const [res] = await db.query(
        // 🎯 แก้ไข: ใช้ตาราง 'rooms'
        'INSERT INTO rooms (name, floor, capacity, has_projector, is_available) VALUES (?, ?, ?, ?, ?)',
        [name, floor, capacity, hasProjector, isAvailable]
    );
    return res.insertId;
}

// 4. อัปเดตข้อมูลห้องประชุม (พร้อม Whitelist ป้องกัน SQL Injection)
async function updateMeetingRoom(id, fields) {
    const keys = Object.keys(fields);
    
    // กำหนด Whitelist ของคอลัมน์ที่อนุญาตให้อัปเดต
    const ALLOWED_FIELDS = ['name', 'floor', 'capacity', 'has_projector', 'is_available'];
    
    const filteredKeys = keys.filter(key => ALLOWED_FIELDS.includes(key));
    const filteredValues = filteredKeys.map(key => fields[key]);

    if (filteredKeys.length === 0) return;

    // สร้างส่วน SET ของ SQL Query
    const setStr = filteredKeys.map(k => `${k} = ?`).join(', ');
    
    // 🎯 แก้ไข: ใช้ตาราง 'rooms'
    await db.query(`UPDATE rooms SET ${setStr} WHERE id = ?`, [...filteredValues, id]);
}

// 5. ลบห้องประชุม
async function deleteMeetingRoom(id) {
    // 🎯 แก้ไข: ใช้ตาราง 'rooms'
    await db.query('DELETE FROM rooms WHERE id = ?', [id]);
}


module.exports = { 
    getAllMeetingRooms, 
    getMeetingRoomById, 
    createMeetingRoom, 
    updateMeetingRoom, 
    deleteMeetingRoom 
};