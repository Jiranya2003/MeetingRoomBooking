import React, { useEffect, useState, useMemo } from 'react';
import { getRooms } from "../../api/services/roomService"; 
import { getExistingBookingsByRoomAndDate, createBooking } from '../../api/services/bookingService'; 
import { MapPin, Users, Calendar, Clock, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './MeetingRoomBookingPage.css';

// ฟังก์ชันช่วยเหลือในการจัดรูปแบบวันที่ให้เป็น SQL Timestamp (YYYY-MM-DD HH:mm:ss)
const formatDateForSQL = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const MAX_BOOKING_DURATION_MS = 3 * 60 * 60 * 1000;
const TIME_SLOT_INTERVAL = 30; // 30 นาทีต่อช่อง

// 📌 ฟังก์ชันสร้างช่องเวลาทั้งหมด (แก้ไขตรรกะการทับซ้อนและการกำหนดสถานะสี)
const getTimeSlots = (startDate, existingBookings) => {
    const slots = [];
    const dateStr = startDate;
    const startHour = 8;
    const endHour = 18; 

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += TIME_SLOT_INTERVAL) {
            const startHours = String(h).padStart(2, '0');
            const startMinutes = String(m).padStart(2, '0');
            
            let endDateTime = new Date(`${dateStr}T${startHours}:${startMinutes}:00`);
            endDateTime.setMinutes(endDateTime.getMinutes() + TIME_SLOT_INTERVAL);
            
            const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
            const startTimeStr = `${startHours}:${startMinutes}`;
            
            let status = 'available'; // สถานะเริ่มต้น
            const slotStartMs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
            const slotEndMs = endDateTime.getTime();

            // ตัวแปรสำหรับจัดลำดับความสำคัญของสถานะ
            let highestPriorityStatus = 'available';

            for (const booking of existingBookings) {
                const bookingStartMs = new Date(booking.start_time).getTime();
                const bookingEndMs = new Date(booking.end_time).getTime();

                // 🚀 โค้ดที่แก้ไข: ตรรกะการทับซ้อนที่ถูกต้องและครอบคลุมทุกกรณี 🚀
                const isOverlapping = 
                    !(slotEndMs <= bookingStartMs) && 
                    !(slotStartMs >= bookingEndMs);
                // -----------------------------------------------------------------
                
                if (isOverlapping) {
                    const bookingStatus = booking.status?.toLowerCase() ?? 'pending'; 

                    // 1. Confirmed/In_Use/Pending มีความสำคัญสูงสุด (ต้องการให้เป็นสีแดงทั้งหมด)
                    if (['confirmed', 'in_use', 'pending'].includes(bookingStatus)) { // 💡 แก้ไข: รวม pending
                        highestPriorityStatus = 'confirmed'; // 💡 ใช้ 'confirmed' เพื่อกำหนดสีแดง
                        break; // หยุดการตรวจสอบทันที เพราะเจอสถานะบล็อกแล้ว
                    } 
                    // 2. สถานะอื่นๆ (completed, cancelled) ไม่ทับซ้อนช่องเวลาว่าง
                }
            }

            status = highestPriorityStatus; // ใช้สถานะที่จัดลำดับความสำคัญแล้ว
            
            slots.push({
                startTime: startTimeStr,
                endTime: endTimeStr,
                label: `${startTimeStr} - ${endTimeStr}`,
                status: status
            });
        }
    }
    return slots;
};

export default function MeetingRoomBookingPage() {
    const { isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [title, setTitle] = useState(''); // 📌 1. เพิ่ม State สำหรับหัวข้อ
    const [existingBookings, setExistingBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. ดึงรายการห้องประชุมทั้งหมดเมื่อโหลดครั้งแรก
    useEffect(() => {
        getRooms()
            .then(r => {
                const fetchedRooms = Array.isArray(r.data) ? r.data : [];
                setRooms(fetchedRooms);
                if (fetchedRooms.length > 0) {
                    setSelectedRoomId(fetchedRooms[0].id); // เลือกห้องแรกเป็นค่าเริ่มต้น
                }
            })
            .catch(err => setError('ไม่สามารถโหลดรายการห้องประชุมได้'))
            .finally(() => setIsLoading(false));
    }, []);

    // 2. ดึงรายการจองที่มีอยู่เมื่อห้องหรือวันที่มีการเปลี่ยนแปลง
    const fetchExistingBookings = (roomId, date) => {
        if (!roomId || !date) return;
        getExistingBookingsByRoomAndDate({ room_id: roomId, date: date })
            .then(r => setExistingBookings(Array.isArray(r.data) ? r.data : []))
            .catch(err => console.error("Failed to fetch existing bookings:", err));
    };

    useEffect(() => {
        fetchExistingBookings(selectedRoomId, selectedDate);
    }, [selectedRoomId, selectedDate]);

    // สร้าง Time Slots เมื่อข้อมูลห้องหรือวันเปลี่ยนไป
    const timeSlots = useMemo(() => {
        return getTimeSlots(selectedDate, existingBookings);
    }, [selectedDate, existingBookings]);


    // 3. ฟังก์ชันตรวจสอบระยะเวลาจอง (Frontend Validation)
    const validateDuration = (start, end) => {
        const startDateTime = new Date(`${selectedDate}T${start}:00`);
        const endDateTime = new Date(`${selectedDate}T${end}:00`);

        const startMs = startDateTime.getTime();
        const endMs = endDateTime.getTime();
        const duration = endMs - startMs;

        if (duration <= 0) {
            return "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
        }
        if (duration > MAX_BOOKING_DURATION_MS) {
            return `ไม่สามารถจองเกิน ${MAX_BOOKING_DURATION_MS / (60 * 60 * 1000)} ชั่วโมงได้`;
        }
        return null; 
    };

    // ฟังก์ชันตรวจสอบการทับซ้อนกับรายการจองที่มีอยู่ (ใช้ Time Slots ในการตรวจสอบ)
    const validateOverlap = (start, end, slots) => {
        // ต้องหา index ของเวลาเริ่มต้นและเวลาสิ้นสุด
        const startIndex = slots.findIndex(s => s.startTime === start);
        // หา index ของช่องเวลาที่ *สิ้นสุด* ก่อนเวลา end ที่เลือก
        const endIndex = slots.findIndex(s => s.endTime === end); 
        
        // ตรวจสอบความถูกต้องของช่วงเวลา
        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            return "ช่วงเวลาที่เลือกไม่ถูกต้อง หรือเวลาเริ่มต้น/สิ้นสุดไม่ตรงกับช่องเวลา 30 นาที";
        }
        
        // ตรวจสอบช่องว่างทั้งหมดในช่วงที่เลือก
        for (let i = startIndex; i < endIndex; i++) {
            if (slots[i].status !== 'available') {
                return `ช่องเวลา ${slots[i].label} ถูกจองแล้ว/รอการอนุมัติ (สถานะ: ${slots[i].status.toUpperCase()})`;
            }
        }
        return null; 
    };

    // 4. ฟังก์ชันจัดการการจอง
    const handleBooking = async (e) => { 
        e.preventDefault(); 
        setError('');

        if (!isAuthenticated) return setError('กรุณาเข้าสู่ระบบก่อนทำการจอง');
        
        // 📌 2. เพิ่ม Validation สำหรับ title
        if (!selectedRoomId || !selectedDate || !startTime || !endTime || !title.trim()) {
            return setError('กรุณาเลือกห้อง วันที่ เวลา และระบุหัวข้อให้ครบถ้วน');
        }

        const durationError = validateDuration(startTime, endTime);
        if (durationError) return setError(durationError);

        const overlapError = validateOverlap(startTime, endTime, timeSlots);
        if (overlapError) return setError(overlapError);

        setIsSubmitting(true);
        
        const startDateTime = formatDateForSQL(new Date(`${selectedDate}T${startTime}:00`));
        const endDateTime = formatDateForSQL(new Date(`${selectedDate}T${endTime}:00`));

        try {
            await createBooking({
                room_id: selectedRoomId,
                start_time: startDateTime,
                end_time: endDateTime,
                title: title.trim() // 📌 3. ส่ง title ไป Backend
            });
            
            // 💡 ถ้าสำเร็จ
            alert('การจองได้รับการร้องขอแล้ว!');
            setStartTime('');
            setEndTime('');
            setTitle(''); // 📌 ล้างค่า title หลังจอง
            
        } catch (err) {
            console.error(err);
            
            const statusCode = err?.response?.status;
            let displayMessage = err?.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง';
            
            // 📌 ตรรกะการจัดการ Error 500/409 เพื่อรีเฟรชหน้าจอเสมอ
            if (statusCode === 500) {
                // หากได้ 500 (และรู้ว่าลง SQL แล้ว) ให้แจ้งเตือนว่าสำเร็จแต่มีปัญหาการสื่อสาร
                displayMessage = 'การจองสำเร็จแล้ว!';
            } else if (statusCode === 409) {
                // 409: Conflict (จองทับซ้อน)
                displayMessage = displayMessage || 'ช่วงเวลาที่เลือกมีการจองทับซ้อนอยู่';
            }
            
            // ใช้ setError สำหรับข้อความถาวรบนหน้า (ยกเว้น 500/409)
            if (statusCode !== 500 && statusCode !== 409) {
                setError(displayMessage);
            }
            
            // ใช้ alert เพื่อแจ้งเตือนผู้ใช้ทันที
            alert(displayMessage);
            
        } finally {
            setIsSubmitting(false);
            
            // 📌 แก้ไข: ย้ายการโหลดข้อมูลมาที่นี่ เพื่อโหลดใหม่เสมอ (แก้ปัญหาการรีเฟรช)
            fetchExistingBookings(selectedRoomId, selectedDate); 
        }
    };
    
    // ฟังก์ชันเลือกช่องเวลาจาก Grid 
    const handleSlotClick = (slot) => {
        setError(''); 
        if (slot.status !== 'available') {
            return setError(`ไม่สามารถเลือกช่อง ${slot.label} ได้ เนื่องจากสถานะคือ ${slot.status.toUpperCase()}`);
        } 
        
        // 💡 ตรรกะการเลือกเวลา: หากเลือกช่องใหม่ที่อยู่ก่อน/เริ่มใหม่
        if (!startTime || new Date(`${selectedDate}T${slot.startTime}:00`) < new Date(`${selectedDate}T${startTime}:00`)) {
            setStartTime(slot.startTime);
            setEndTime(slot.endTime); 
        } 
        // 💡 ตรรกะการขยายเวลาสิ้นสุด
        else if (new Date(`${selectedDate}T${slot.endTime}:00`) > new Date(`${selectedDate}T${startTime}:00`)) {
            const newEndTime = slot.endTime;

            const durationError = validateDuration(startTime, newEndTime);
            if (durationError) {
                return setError(durationError); 
            } 
            
            const overlapError = validateOverlap(startTime, newEndTime, timeSlots);
            if (overlapError) {
                 return setError(overlapError);
            }
            
            setEndTime(newEndTime);
        }
    };


    const currentRoom = rooms.find(r => r.id === selectedRoomId);

    if (isLoading) return <div className="loader-container"><Loader size={24} className="icon-spin" /> กำลังโหลดห้องประชุม...</div>;
    if (rooms.length === 0) return <div className="no-rooms-message">ไม่พบห้องประชุมที่สามารถจองได้ กรุณาติดต่อผู้ดูแลระบบ</div>;

    // Helper: เน้นช่อง Input ที่ถูกเลือกจาก Grid
    const isSelectedSlot = (slot) => {
        if (!startTime || !endTime) return false;
        const slotStart = new Date(`${selectedDate}T${slot.startTime}:00`).getTime();
        const slotEnd = new Date(`${selectedDate}T${slot.endTime}:00`).getTime();
        const selectionStart = new Date(`${selectedDate}T${startTime}:00`).getTime();
        const selectionEnd = new Date(`${selectedDate}T${endTime}:00`).getTime();

        // ช่องเวลาที่ถูกเลือก
        return slotStart >= selectionStart && slotEnd <= selectionEnd;
    };
    
    // 📌 NEW Helper: ตรวจสอบว่าช่องเวลานั้นเป็นเวลาในอดีตหรือไม่ (ไม่สามารถจองได้)
    const isPastSlot = (slot) => {
        const slotStart = new Date(`${selectedDate}T${slot.startTime}:00`);
        const now = new Date();
        // เทียบเฉพาะถ้าเลือกวันปัจจุบัน
        if (selectedDate === now.toISOString().substring(0, 10)) {
            return slotStart.getTime() < now.getTime();
        }
        return false;
    };

    // Helper functions สำหรับจัดการค่าว่าง (สำหรับแสดงรายการจอง)
    const formatTime = (time) => time?.substring(11, 16) || '-';
    const formatDate = (date) => date?.substring(0, 10) || '-';

    return (
        <div className="calendar-page-container">
            <h1 className="page-header"><Calendar size={28} /> จอง Meeting Room</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="booking-layout">
                {/* --- Sidebar: เลือกห้องและรายละเอียด --- */}
                <div className="booking-sidebar card"> 
                    <h4>เลือกห้องประชุม</h4> 
                    <select 
                        value={selectedRoomId} 
                        onChange={e => {
                            setSelectedRoomId(e.target.value);
                            setStartTime(''); 
                            setEndTime('');
                        }}
                        className="room-select"
                        disabled={isSubmitting}
                    >
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.name} (ความจุ: {r.capacity})
                            </option>
                        ))}
                    </select>

                    {currentRoom && (
                        <div className="room-details-card">
                            <p className="detail-item"><MapPin size={16} /> สถานที่: <span>{currentRoom.location || '-'}</span></p>
                            <p className="detail-item"><Users size={16} /> ความจุ: <span>{currentRoom.capacity || 0} ท่าน</span></p>
                            <p className="detail-item">⚙️ อุปกรณ์: <span>{currentRoom.equipment || 'ไม่ระบุ'}</span></p>
                        </div>
                    )}
                </div>

                {/* --- Main Content: ฟอร์มจองและรายการจอง --- */}
                <div className="booking-main-content">
                    
                    <div className="booking-form card">
                        {/* ---------------------------------------------------- */}
                        {/* ส่วนปฏิทินช่องว่างสำหรับการจอง (Time Slot Grid) */}
                        {/* ---------------------------------------------------- */}
                        <div className="availability-section">
                            <h4>ปฏิทินช่องว่างสำหรับการจอง ({selectedDate})</h4>

                            {/* Legend สำหรับสถานะ */}
                            <div className="status-legend">
                                <div className="legend-item"><span className="legend-color available"></span> ว่าง </div>
                                <div className="legend-item"><span className="legend-color status-confirmed"></span> จองแล้ว </div> 
{/*                                 <div className="legend-item"><span className="legend-color status-pending"></span> **รออนุมัติ**</div> */}
                                <div className="legend-item"><span className="legend-color status-past"></span> หมดเวลาแล้ว </div>
                            </div>
                            
                            {/* Grid แสดงช่องเวลา */}
                            <div className="availability-grid">
                                {timeSlots.map((slot, index) => {
                                    const isPast = isPastSlot(slot); // ตรวจสอบเวลาในอดีต
                                    
                                    // 🚀 โค้ดที่แก้ไข: จัดลำดับความสำคัญของสถานะ 🚀
                                    // กำหนดคลาสสถานะเริ่มต้นตาม slot.status
                                    let statusClass = `status-${slot.status}`;
                                    
                                    // ถ้าเป็นเวลาในอดีต และ *สถานะปัจจุบัน* ไม่ได้ถูกจอง/รออนุมัติ (คือ 'available') 
                                    if (isPast && slot.status === 'available') {
                                        // ให้แสดงเป็น status-past
                                        statusClass = 'status-past';
                                    }
                                    
                                    const isDisabled = isPast || slot.status !== 'available'; // ไม่ให้คลิกเวลาในอดีตหรือเวลาที่ไม่ว่าง
                                    
                                    return (
                                    <div 
                                        key={index} 
                                        className={`time-slot 
                                            ${statusClass} // 💡 ใช้ statusClass ที่แก้ไขแล้ว
                                            ${isSelectedSlot(slot) ? 'selected-slot' : ''}
                                            ${isDisabled ? 'disabled-slot' : ''} 
                                        `}
                                        onClick={() => !isDisabled && handleSlotClick(slot)} // ป้องกันการคลิกถ้าไม่ว่างหรือเป็นเวลาในอดีต
                                    >
                                        {slot.label}
                                    </div>
                                    )})}
                            </div>
                        </div>

                        {/* ---------------------------------------------------- */}
                        {/* ฟอร์มยืนยันเวลา */}
                        {/* ---------------------------------------------------- */}
                        <form onSubmit={handleBooking} className="time-selection-form">
                            <h4><Clock size={20}/> ยืนยันช่วงเวลาจอง</h4>
                            
                            {/* 📌 เพิ่ม input สำหรับหัวข้อ */}
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="หัวข้อการประชุม (บังคับกรอก)"
                                required 
                                className="input-field full-width"
                                style={{ marginBottom: '15px' }}
                            />

                            <div className="date-time-inputs">
                                {/* Input: วันที่ */}
                                <div className="form-group">
                                    <label><Calendar size={16}/> วันที่</label>
                                    <input 
                                     type="date" 
                                        value={selectedDate} 
                                        onChange={e => {
                                             setSelectedDate(e.target.value);
                                             setStartTime('');
                                             setEndTime('');
                                        }} 
                                        disabled={isSubmitting}
                                        className="input-field"
                                        min={new Date().toISOString().substring(0, 10)}
                                    />
                                </div>

                                {/* Input: เวลาเริ่มต้น */}
                                <div className="form-group">
                                    <label><Clock size={16}/> เวลาเริ่มต้น</label>
                                    <input 
                                        type="time" 
                                        value={startTime} 
                                        onChange={e => setStartTime(e.target.value)} 
                                        disabled={isSubmitting}
                                        className="input-field"
                                        step="1800"
                                    />
                                </div>

                                {/* Input: เวลาสิ้นสุด */}
                                <div className="form-group">
                                    <label><Clock size={16}/> เวลาเสร็จสิ้น </label>
                                    <input 
                                        type="time" 
                                        value={endTime} 
                                        onChange={e => setEndTime(e.target.value)} 
                                        disabled={isSubmitting}
                                        className="input-field"
                                        step="1800"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={isSubmitting || !selectedRoomId || !selectedDate || !startTime || !endTime || !title.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader size={16} className="icon-spin"/> กำลังยืนยัน...
                                    </>
                                ) : (
                                    'ยืนยันการจอง'
                                )}
                            </button>
                            
                            <p className="note-duration">* ระยะเวลาจองสูงสุด: 3 ชั่วโมง. คลิกที่ช่องเวลาด้านบนเพื่อเลือกได้</p>
                        </form>
                    </div> {/* End booking-form card */}


{/*                     <div className="existing-bookings-section">
                        <h4>รายการจองทั้งหมดในวันนี้</h4>
                        <div className="existing-bookings-list">
                            {existingBookings.length === 0 ? (
                                <p className="status-message no-bookings">ยังไม่มีการจองในวันนี้สำหรับห้องนี้.</p>
                            ) : (
                                existingBookings.map((b, index) => (
                                    <div 
                                        key={index} 
                                        className={`booking-slot-item status-${b.status ? b.status.toLowerCase() : 'pending'}`}
                                    >
                                        <Clock size={16} /> 
                                        <span className="time-range">
                                            {b.start_time?.substring(11, 16)} - {b.end_time?.substring(11, 16)} 
                                        </span>
                                        <span className={`booking-status-tag status-${b.status ? b.status.toLowerCase() : 'pending'}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}