const db = require('../config/db');

// กำหนดชื่อตารางที่แน่นอน (ยืนยันว่าชื่อตารางคือ 'rooms' ตามที่เห็นใน phpMyAdmin)
const TABLE_NAME = 'rooms'; 
const ROOM_FIELDS = ['name', 'location', 'capacity', 'description', 'equipment']; // คอลัมน์ที่อนุญาตให้ใช้งาน

async function getAllRooms() {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} ORDER BY id`);
    return rows;
}

async function getRoomById(id) {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    return rows[0];
}

async function createRoom({ name, location, capacity, description, equipment }) {
    const [res] = await db.query(
        `INSERT INTO ${TABLE_NAME} (name, location, capacity, description, equipment) VALUES (?, ?, ?, ?, ?)`, 
        [name, location, capacity, description, equipment]
    );
    return res.insertId;
}

/**
 * อัปเดตข้อมูลห้องประชุม โดยใช้ Whitelisting เพื่อความปลอดภัย
 * @param {number} id - Room ID
 * @param {object} fields - Object ที่มี fields และค่าที่ต้องการอัปเดต
 */
async function updateRoom(id, fields) {
    const keys = Object.keys(fields);
    
    // 💡 ปรับปรุง: การกรองเฉพาะคอลัมน์ที่อนุญาต (Whitelisting)
    const filteredKeys = keys.filter(key => ROOM_FIELDS.includes(key));
    const filteredValues = filteredKeys.map(key => fields[key]);
    
    if (filteredKeys.length === 0) return;

    // สร้าง string สำหรับ SET: "key1 = ?, key2 = ?, ..."
    const setStr = filteredKeys.map(k => `${k} = ?`).join(', ');

    // รัน Query: [...filteredValues] จะถูกแทนที่ใน setStr, และ id จะถูกแทนที่ใน WHERE
    await db.query(`UPDATE ${TABLE_NAME} SET ${setStr} WHERE id = ?`, [...filteredValues, id]);
}

async function deleteRoom(id) {
    await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
}

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };