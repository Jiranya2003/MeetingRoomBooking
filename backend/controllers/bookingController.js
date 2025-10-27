const Booking = require('../models/Booking');
const userModel = require('../models/User'); 
const roomModel = require('../models/Room'); 
const { sendBookingConfirmationEmail } = require('../services/emailService'); 

// 💡 กำหนดค่าคงที่สำหรับระยะเวลาจองสูงสุด (3 ชั่วโมง = 10,800,000 มิลลิวินาที)
const MAX_BOOKING_DURATION_MS = 3 * 60 * 60 * 1000; 

// -----------------------------------------------------------------
// 🚨 1. REPLACED: ฟังก์ชัน createBooking พร้อมตรวจสอบระยะเวลาสูงสุด
// -----------------------------------------------------------------
const createBooking = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { room_id, start_time, end_time, status } = req.body; 
        
        if (!room_id || !start_time || !end_time) return res.status(400).json({ message: 'Missing fields' });

        // --- NEW LOGIC: ตรวจสอบระยะเวลาจอง ---
        const startTimeMs = new Date(start_time).getTime();
        const endTimeMs = new Date(end_time).getTime();
        const durationMs = endTimeMs - startTimeMs;

        if (durationMs <= 0) {
            // ป้องกันการจองข้ามวันหรือเวลาสิ้นสุดก่อนเริ่มต้น
            return res.status(400).json({ message: 'End time must be after start time on the same day.' });
        }
        
        if (durationMs > MAX_BOOKING_DURATION_MS) {
            // 🚨 ส่ง Error 400 ถ้าเกิน 3 ชั่วโมง
            return res.status(400).json({ message: 'Booking duration exceeds the 3-hour limit.' });
        }
        // ---------------------------------------

        // 💡 กำหนดสถานะเริ่มต้น: ใช้ค่าที่ Frontend ส่งมา ('CONFIRMED') หรือ 'PENDING' เป็นค่า Default
        const initialStatus = (status?.toUpperCase() === 'CONFIRMED') ? 'CONFIRMED' : 'PENDING';


        // 1.1 ตรวจสอบการทับซ้อน (Overlap Check)
        const overlap = await Booking.hasOverlap(room_id, start_time, end_time);
        if (overlap) return res.status(409).json({ message: 'Time slot already booked' });

        // 1.2 สร้างการจองในฐานข้อมูล
        const newBookingId = await Booking.createBooking({ 
            user_id, 
            room_id, 
            start_time, 
            end_time, 
            status: initialStatus
        });

        // 1.3 ดึงข้อมูลสำหรับ Email (ต้องดึงชื่อผู้ใช้และชื่อห้อง)
        const user = await userModel.findById(user_id);
        const room = await roomModel.getRoomById(room_id); 
        
        const bookingDetails = {
            id: newBookingId,
            user_name: user?.name || user?.email || 'N/A', 
            room_name: room?.name || 'Unknown Room', // ดึงชื่อห้อง
            start_time: start_time,
            end_time: end_time,
            status: initialStatus
        };

        // 1.4 ส่งอีเมลแจ้งเตือน
        if (user && user.email) {
            await sendBookingConfirmationEmail(user.email, bookingDetails);
        }

        res.status(201).json({ 
            message: initialStatus === 'CONFIRMED' ? 
                     'Booking confirmed automatically. Confirmation email sent.' :
                     'Booking created successfully. Waiting for approval. Confirmation email sent.',
            bookingId: newBookingId 
        });

    } catch (err) {
        console.error('Error creating booking:', err);
        // 💡 ส่ง Error Message ที่เหมาะสมหากการส่งเมลล้มเหลว (ตามที่ emailService throw)
        const errorMessage = err.message.includes('email') ? err.message : 'Server error occurred during booking.';
        res.status(500).json({ message: errorMessage });
    }
};

// -----------------------------------------------------------------
// 2. ฟังก์ชันอื่นๆ (GET/DELETE/PATCH) - คงเดิม
// -----------------------------------------------------------------

const getMyBookings = async (req, res) => {
    try {
        const rows = await Booking.getBookingsByUser(req.user.id);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const rows = await Booking.getAllBookings();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await Booking.updateBookingStatus(id, status);
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBooking = async (req, res) => {
    try {
        await Booking.deleteBooking(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

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


module.exports = { 
    createBooking, 
    getMyBookings, 
    getAllBookings, 
    updateStatus, 
    deleteBooking,
    getExistingBookingsByRoomAndDate 
};