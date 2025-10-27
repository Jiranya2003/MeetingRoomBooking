const MeetingRoom = require('../models/MeetingRoom');

/**
 * Controller สำหรับจัดการ Logic ของ MeetingRoom APIs
 */

// [GET] ดึงข้อมูลห้องประชุมทั้งหมด
exports.getAllMeetingRooms = async (req, res) => {
    try {
        // 🚨 Assumes MeetingRoom.getAllMeetingRooms() uses the corrected table name 'rooms'
        const rooms = await MeetingRoom.getAllMeetingRooms();
        res.status(200).json(rooms);
    } catch (error) {
        // 🚨 ให้ log error ที่ชัดเจนเพื่อให้รู้ว่าปัญหามาจาก DB
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
    
    // 💡 การตรวจสอบความถูกต้องของข้อมูล (Frontend มักจะส่งเป็น String)
    const parsedCapacity = parseInt(capacity, 10);
    if (!name || isNaN(parsedCapacity) || parsedCapacity <= 0) {
        return res.status(400).json({ message: 'Name and capacity (must be a positive number) are required.' });
    }
    
    try {
        // 💡 ส่งค่าที่แปลงแล้วและใช้ Default values ที่เหมาะสม
        const newRoomId = await MeetingRoom.createMeetingRoom({ 
            name, 
            floor: floor || null, // ส่ง null ถ้าไม่ระบุ
            capacity: parsedCapacity, 
            hasProjector: !!hasProjector, // แปลงเป็น boolean
            isAvailable: isAvailable !== undefined ? !!isAvailable : true 
        });

        res.status(201).json({ 
            message: 'Meeting Room created successfully.', 
            id: newRoomId 
        });
    } catch (error) {
        console.error('Error creating meeting room:', error.message);
        // ตรวจสอบถ้าเป็น Duplicate entry (ER_DUP_ENTRY)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Meeting Room name or unique identifier already exists.' });
        }
        // 🚨 ข้อผิดพลาดอื่น ๆ ที่มาจาก DB/Model
        res.status(500).json({ message: 'Internal Server Error: Could not create room.' });
    }
};

// [PUT/PATCH] อัปเดตข้อมูลห้องประชุม (Admin Only)
exports.updateMeetingRoom = async (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    // ตรวจสอบว่ามีข้อมูลให้อัปเดตหรือไม่
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }
    
    // 💡 ตรวจสอบและแปลง capacity ถ้ามี
    if (updates.capacity !== undefined) {
        const parsedCapacity = parseInt(updates.capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({ message: 'Capacity must be a positive number.' });
        }
        updates.capacity = parsedCapacity;
    }

    try {
        // อัปเดตข้อมูล
        const result = await MeetingRoom.updateMeetingRoom(id, updates);
        
        // 💡 ถ้า Model ส่งจำนวนแถวที่กระทบมา เราสามารถตรวจสอบ 404 ได้
        // (สมมติว่า Model ส่งค่ากลับมาเพื่อให้ทราบว่ามีการอัปเดตสำเร็จ)

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
        
        // ดำเนินการลบ
        const result = await MeetingRoom.deleteMeetingRoom(id);
        
        // 💡 สมมติว่า Model ลบสำเร็จ
        res.status(200).json({ message: 'Meeting Room deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting meeting room ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Internal Server Error: Could not delete room.' });
    }
};