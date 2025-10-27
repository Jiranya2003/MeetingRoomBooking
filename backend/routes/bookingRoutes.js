const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, checkAdminRole, checkUserRole } = require('../middlewares/authMiddleware');

// 🚨 NEW ROUTE: ใช้สำหรับดึงข้อมูลปฏิทิน/ห้องว่าง
// GET /api/bookings/available?room_id=X&date=Y
router.get('/available', bookingController.getExistingBookingsByRoomAndDate); // ✅ ชื่อ Controller ตรงแล้ว

router.post('/', verifyToken, checkUserRole, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings); 
router.delete('/:id', verifyToken, checkUserRole, bookingController.deleteBooking);

// Admin Routes
router.get('/', verifyToken, checkAdminRole, bookingController.getAllBookings); 
router.patch('/:id/status', verifyToken, checkAdminRole, bookingController.updateStatus);


module.exports = router;