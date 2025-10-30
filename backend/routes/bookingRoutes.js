const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, checkAdminRole, checkUserRole } = require('../middlewares/authMiddleware');

// -----------------------------------------------------------------
// Route สำหรับดึงข้อมูลปฏิทิน / ตรวจสอบห้องว่าง
// GET /api/bookings/available?room_id=X&date=Y
// -----------------------------------------------------------------
router.get('/available', verifyToken, bookingController.getExistingBookingsByRoomAndDate);

// -----------------------------------------------------------------
// ผู้ใช้ทั่วไป (User) Routes
// -----------------------------------------------------------------
// สร้างการจองใหม่
// 📌 แก้ไข: verifyToken ต้องอยู่ก่อน checkUserRole เพื่อให้ req.user ถูกกำหนดก่อนการตรวจสอบ Role
router.post('/', verifyToken, checkUserRole, bookingController.createBooking); 

// ดึง booking ของตัวเอง
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);

// ลบ booking ของตัวเอง (ตรวจสอบกฎการยกเลิก)
router.delete('/:id', verifyToken, checkUserRole, bookingController.deleteBooking);

// -----------------------------------------------------------------
// Admin Routes
// -----------------------------------------------------------------
// ดึง booking ทั้งหมด
router.get('/', verifyToken, checkAdminRole, bookingController.getAllBookings);

// อัปเดตสถานะ booking (Admin ไม่สามารถแก้สถานะ IN_USE หรือ COMPLETED)
router.patch('/:id/status', verifyToken, checkAdminRole, bookingController.updateStatus);

module.exports = router;