const db = require('../config/db');

/**
 * ค้นหาผู้ใช้จากอีเมล (ใช้ในการ Login และ Register)
 */
async function findByEmail(email) {
    // ดึงข้อมูลทั้งหมดรวมถึงรหัสผ่าน (password) สำหรับการเปรียบเทียบใน Controller
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

/**
 * ดึงข้อมูลผู้ใช้ตาม ID (ใช้สำหรับ JWT Verification และ Email Notification)
 */
async function findById(id) {
    // ดึงเฉพาะ ID, name, email, role, created_at (ไม่ดึงรหัสผ่าน)
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
}

/**
 * สร้างผู้ใช้ใหม่ในฐานข้อมูล
 * @param {object} user - ข้อมูลผู้ใช้ใหม่ (password ควรถูก hash มาแล้วก่อนเรียกใช้ฟังก์ชันนี้)
 */
async function createUser({ name, email, password, role = 'user' }) {
    const [result] = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
    return result.insertId;
}

module.exports = { findByEmail, createUser, findById };