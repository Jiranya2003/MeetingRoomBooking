const Booking = require('../models/Booking'); 
const userModel = require('../models/User'); 
const roomModel = require('../models/Room'); 
const { sendBookingConfirmationEmail } = require('../services/emailService'); 
const cron = require('node-cron');

// 💡 กำหนดค่าคงที่สำหรับระยะเวลาจองสูงสุด (3 ชั่วโมง)
const MAX_BOOKING_DURATION_MS = 3 * 60 * 60 * 1000; 

// -----------------------------------------------------------------
// 1. สร้าง Booking ใหม่
// -----------------------------------------------------------------
const createBooking = async (req, res) => {
    try {
        // 📌 ปรับปรุง: ตรวจสอบว่า req.user.id มีค่าหรือไม่ (ป้องกัน 500 ถ้า Middleware ล้มเหลว)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication failed: User ID not available.' });
        }
        
        const user_id = req.user.id;
        const { room_id, start_time, end_time, status, title } = req.body; 
        
        if (!room_id || !start_time || !end_time) 
            return res.status(400).json({ message: 'Missing required booking fields.' });

        // --- ตรวจสอบระยะเวลา ---
        const startTimeMs = new Date(start_time).getTime();
        const endTimeMs = new Date(end_time).getTime();
        const durationMs = endTimeMs - startTimeMs;

        if (durationMs <= 0) 
            return res.status(400).json({ message: 'End time must be after start time.' });

        if (durationMs > MAX_BOOKING_DURATION_MS)
            return res.status(400).json({ message: 'Booking duration exceeds the 3-hour limit.' });

        // --- สร้าง booking (Model จะตรวจสอบการทับซ้อนภายใน) ---
        const initialStatus = status?.toUpperCase() || Booking.determineInitialStatus(start_time, end_time);

        const newBookingId = await Booking.createBooking({ 
            user_id, 
            room_id, 
            start_time, 
            end_time, 
            status: initialStatus,
            title
        });

        // --- ดึงข้อมูลสำหรับ email ---
        const user = await userModel.findById(user_id);
        const room = await roomModel.getRoomById(room_id);
        
        const bookingDetails = {
            id: newBookingId,
            user_name: user?.name || user?.email || 'N/A',
            room_name: room?.name || 'Unknown Room',
            start_time,
            end_time,
            status: initialStatus,
            title: title || ''
        };

        if (user && user.email) {
            await sendBookingConfirmationEmail(user.email, bookingDetails);
        }

        // 📌 แก้ไข: ยืนยันการตอบกลับ 201
        res.status(201).json({ 
            message: `Booking created successfully (${initialStatus}). Confirmation email sent.`,
            bookingId: newBookingId,
            data: bookingDetails // ส่งข้อมูลที่สร้างกลับไปเผื่อ Frontend ต้องการใช้
        });

    } catch (err) {
        console.error('Error creating booking:', err.message);
        
        // 📌 แก้ไข: จัดการ Error 409 (Conflict) ที่โยนมาจาก Model
        if (err.statusCode === 409) {
            return res.status(409).json({ message: err.message });
        }
        
        // Error อื่นๆ (เช่น DB Error, Email Service Error)
        res.status(500).json({ message: 'Server error occurred during booking. Please check server logs.' });
    }
};

// -----------------------------------------------------------------
// 2. ดึง booking ของผู้ใช้
// -----------------------------------------------------------------
const getMyBookings = async (req, res) => {
    try {
        const rows = await Booking.getBookingsByUser(req.user.id);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching my bookings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------
// 3. ดึง booking ทั้งหมด (Admin)
// -----------------------------------------------------------------
const getAllBookings = async (req, res) => {
    try {
        const rows = await Booking.getAllBookings();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------
// 4. อัปเดตสถานะ booking (Admin)
// -----------------------------------------------------------------
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) return res.status(400).json({ message: 'Status field is required.' });

        const booking = await Booking.getBookingById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // 📌 แก้ไข: ห้ามเปลี่ยนสถานะที่ถูกกำหนดโดยระบบอัตโนมัติ (ยกเว้น Admin เปลี่ยนจาก PENDING/CONFIRMED)
        const autoStatuses = ['IN_USE','COMPLETED']; 
        if (autoStatuses.includes(booking.status)) {
            return res.status(400).json({ message: `Cannot manually change status from ${booking.status}.` });
        }
        
        // อนุญาตให้ Admin เปลี่ยนสถานะ PENDING/BOOKED/CONFIRMED/REJECTED/CANCELLED ได้

        await Booking.updateBookingStatus(id, status);
        res.json({ message: 'Booking status updated successfully' });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------
// 5. ลบ booking (ตรวจสอบเวลายกเลิก)
// -----------------------------------------------------------------
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.getBookingById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // 💡 ตรวจสอบความเป็นเจ้าของ หากไม่ใช Admin
        // if (booking.user_id !== req.user.id && !req.user.isAdmin) {
        //     return res.status(403).json({ message: 'Forbidden: You do not own this booking.' });
        // }

        if (!Booking.canCancelBooking(booking)) {
            return res.status(400).json({ message: 'Cannot cancel this booking. Less than 15 minutes to start or already in use/completed.' });
        }

        await Booking.deleteBooking(req.params.id);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------
// 6. ดึง booking ตามห้องและวันที่
// -----------------------------------------------------------------
const getExistingBookingsByRoomAndDate = async (req, res) => {
    try {
        const { room_id, date } = req.query; 
        if (!room_id || !date) {
            return res.status(400).json({ message: 'Missing room_id or date query parameter.' });
        }

        const rows = await Booking.getExistingBookingsByRoomAndDate(room_id, date);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching existing bookings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------
// 7. Scheduler: อัปเดตสถานะ booking อัตโนมัติทุก 5 นาที
// -----------------------------------------------------------------
// 📌 หมายเหตุ: ตรวจสอบให้แน่ใจว่าฟังก์ชันนี้รันเพียงครั้งเดียวเมื่อ Server เริ่มต้น
cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('⏰ Running scheduled booking status update:', new Date());
        await Booking.updateBookingStatusAuto();
        console.log('✅ Booking statuses updated successfully');
    } catch (err) {
        console.error('❌ Error updating booking statuses:', err);
    }
});

module.exports = { 
    createBooking, 
    getMyBookings, 
    getAllBookings, 
    updateStatus, 
    deleteBooking,
    getExistingBookingsByRoomAndDate 
};