const MeetingRoom = require('../models/MeetingRoom');
const Booking = require('../models/Booking');
const cron = require('node-cron');

/**
 * Controller สำหรับจัดการ Logic ของ MeetingRoom APIs
 */

// [GET] ดึงข้อมูลห้องประชุมทั้งหมด
exports.getAllMeetingRooms = async (req, res) => {
    try {
        const rooms = await MeetingRoom.getAllMeetingRooms();
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching all meeting rooms:', error.message);
        res.status(500).json({ message: 'Internal Server Error: Failed to retrieve rooms.' });
    }
};

// [GET] ดึงข้อมูลห้องประชุมตาม ID
exports.getMeetingRoomById = async (req, res) => {
    try {
        const id = req.params.id;
        const room = await MeetingRoom.getMeetingRoomById(id);
        
        if (!room) {
            return res.status(404).json({ message: `Meeting Room with ID ${id} not found.` });
        }

        res.status(200).json(room);
    } catch (error) {
        console.error(`Error fetching meeting room ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Internal Server Error: Failed to retrieve room details.' });
    }
};

// [POST] สร้างห้องประชุมใหม่ (Admin Only)
exports.createMeetingRoom = async (req, res) => {
    const { name, floor, capacity, hasProjector, isAvailable } = req.body;
    const parsedCapacity = parseInt(capacity, 10);
    if (!name || isNaN(parsedCapacity) || parsedCapacity <= 0) {
        return res.status(400).json({ message: 'Name and capacity (must be a positive number) are required.' });
    }
    
    try {
        const newRoomId = await MeetingRoom.createMeetingRoom({ 
            name, 
            floor: floor || null,
            capacity: parsedCapacity, 
            hasProjector: !!hasProjector,
            isAvailable: isAvailable !== undefined ? !!isAvailable : true 
        });

        res.status(201).json({ 
            message: 'Meeting Room created successfully.', 
            id: newRoomId 
        });
    } catch (error) {
        console.error('Error creating meeting room:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Meeting Room name or unique identifier already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error: Could not create room.' });
    }
};

// [PUT/PATCH] อัปเดตข้อมูลห้องประชุม (Admin Only)
exports.updateMeetingRoom = async (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }
    
    if (updates.capacity !== undefined) {
        const parsedCapacity = parseInt(updates.capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({ message: 'Capacity must be a positive number.' });
        }
        updates.capacity = parsedCapacity;
    }

    try {
        await MeetingRoom.updateMeetingRoom(id, updates);
        const updatedRoom = await MeetingRoom.getMeetingRoomById(id);
        if (!updatedRoom) {
             return res.status(404).json({ message: `Meeting Room with ID ${id} not found.` });
        }
        res.status(200).json({ 
            message: 'Meeting Room updated successfully.',
            room: updatedRoom 
        });
        
    } catch (error) {
        console.error(`Error updating meeting room ${id}:`, error.message);
        res.status(500).json({ message: 'Internal Server Error: Could not update room.' });
    }
};

// [DELETE] ลบห้องประชุม (Admin Only)
exports.deleteMeetingRoom = async (req, res) => {
    try {
        const id = req.params.id;
        await MeetingRoom.deleteMeetingRoom(id);
        res.status(200).json({ message: 'Meeting Room deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting meeting room ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Internal Server Error: Could not delete room.' });
    }
};

// -----------------------------------------------------------------
// Scheduler: อัปเดตสถานะห้องประชุมแบบ real-time (ทุก 5 นาที)
// -----------------------------------------------------------------
cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('⏰ Running MeetingRoom status update scheduler:', new Date());
        const allBookings = await Booking.getAllBookings();

        for (const booking of allBookings) {
            const now = new Date();
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);
            let newStatus = null;

            if (start <= now && now <= end && booking.status === 'pending') {
                newStatus = 'confirmed';
            } else if (end < now && (booking.status === 'pending' || booking.status === 'confirmed')) {
                newStatus = 'completed';
            }

            if (newStatus) {
                await Booking.updateBookingStatus(booking.id, newStatus);
                console.log(`Booking ID ${booking.id} marked as ${newStatus}.`);

                // อัปเดตสถานะห้องประชุมตามสถานะ booking
                if (newStatus === 'confirmed') {
                    await MeetingRoom.updateMeetingRoom(booking.room_id, { isAvailable: false });
                } else if (newStatus === 'completed') {
                    await MeetingRoom.updateMeetingRoom(booking.room_id, { isAvailable: true });
                }
            }
        }
    } catch (err) {
        console.error('Error running MeetingRoom scheduler:', err);
    }
});
