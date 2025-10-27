const express = require('express');
const router = express.Router();
const meetingRoomController = require('../controllers/meetingRoomController');
const { verifyToken, checkAdminRole } = require('../middlewares/authMiddleware'); // ใช้ชื่อ Middleware ที่เราวิเคราะห์ไว้

/**
 * ROUTES สำหรับจัดการทรัพยากร MeetingRoom
 */

// 1. GET /api/meetingrooms - ดึงข้อมูลห้องประชุมทั้งหมด (สำหรับ Public/User)
router.route('/')
    .get(meetingRoomController.getAllMeetingRooms) 
    
    // 2. POST /api/meetingrooms - สร้างห้องประชุมใหม่ (Admin Only)
    .post(verifyToken, checkAdminRole, meetingRoomController.createMeetingRoom);

// 3. GET /api/meetingrooms/:id - ดึงข้อมูลห้องประชุมตาม ID
// 4. PUT /api/meetingrooms/:id - อัปเดตห้องประชุม (Admin Only)
// 5. DELETE /api/meetingrooms/:id - ลบห้องประชุม (Admin Only)
router.route('/:id')
    .get(meetingRoomController.getMeetingRoomById)
    .put(verifyToken, checkAdminRole, meetingRoomController.updateMeetingRoom)
    .delete(verifyToken, checkAdminRole, meetingRoomController.deleteMeetingRoom);

module.exports = router;
