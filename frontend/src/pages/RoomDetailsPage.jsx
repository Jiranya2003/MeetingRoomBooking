import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom } from '../api/roomService';
import { createBooking } from '../api/services/bookingService';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, MapPin, Users, Info, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react'; 
import './RoomDetails.css'; 

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

// ฟังก์ชันแยก Date และ Time จาก Date Object
const extractDateTime = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return { date: '', time: '' };
    const date = dateObj.toISOString().substring(0, 10); // YYYY-MM-DD
    const time = dateObj.toTimeString().substring(0, 5); // HH:MM
    return { date, time };
};

const MAX_BOOKING_DURATION_MS = 3 * 60 * 60 * 1000;

export default function RoomDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const [room, setRoom] = useState(null);
    // 🎯 NEW STATE: แยก Date, Start Time, End Time
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); 
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. ดึงข้อมูลห้องประชุม
    useEffect(() => {
        getRoom(id).then(r => setRoom(r.data)).catch(console.error);
    }, [id]);

    // 2. ตั้งค่าเวลาเริ่มต้นและสิ้นสุดอัตโนมัติ (1 ชั่วโมงล่วงหน้า)
    useEffect(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 60 * 60 * 1000); 

        const startInfo = extractDateTime(now);
        const endInfo = extractDateTime(future);
        
        // ตั้งค่าเริ่มต้นของวันที่และเวลา
        setSelectedDate(startInfo.date);
        setTimeStart(startInfo.time);
        setTimeEnd(endInfo.time);
    }, []);

    // 🎯 Helper: รวม Date และ Time ให้เป็น SQL Timestamp
    const getFullTimestamp = (date, time) => {
        if (!date || !time) return null;
        // ต้องสร้าง Date Object ใน Timezone ที่ถูกต้อง (สมมติว่าเป็น Local Time)
        return new Date(`${date}T${time}:00`); 
    };


    // 3. ฟังก์ชันตรวจสอบระยะเวลาจอง (Frontend Validation)
    const validateDuration = (startMs, endMs) => {
        const duration = endMs - startMs;

        if (duration <= 0) {
            return "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
        }
        if (duration > MAX_BOOKING_DURATION_MS) {
            return "ไม่สามารถจองเกิน 3 ชั่วโมงได้";
        }
        return null; // ไม่มีข้อผิดพลาด
    };

    // 4. ฟังก์ชันจัดการการจอง
    const onBook = async () => {
        setError('');
        
        const fullStart = getFullTimestamp(selectedDate, timeStart);
        const fullEnd = getFullTimestamp(selectedDate, timeEnd);

        if (!isAuthenticated) {
            alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
            return navigate('/login');
        }

        if (!fullStart || !fullEnd) {
            return setError('กรุณาระบุวันที่และเวลาให้ครบถ้วน');
        }
        
        // 🎯 Validation Logic
        const durationError = validateDuration(fullStart.getTime(), fullEnd.getTime());
        if (durationError) {
            return setError(durationError);
        }
        
        const start_time_sql = formatDateForSQL(fullStart);
        const end_time_sql = formatDateForSQL(fullEnd);

        setIsSubmitting(true);
        try {
            // ส่งข้อมูลไป Backend
            await createBooking({ 
                room_id: id, 
                start_time: start_time_sql, 
                end_time: end_time_sql,
                // 💡 อาจต้องเพิ่ม Title และ user_id/user_name ในการจองจริง
            });
            
            alert('การจองได้รับการร้องขอเรียบร้อยแล้ว');
            navigate('/my-bookings'); // นำทางไปหน้าการจองของฉัน
        } catch (err) {
            console.error(err);
            const message = err?.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!room) return <div>กำลังโหลด...</div>;
    
    // แยกชื่อห้องเพื่อแสดงผล (เช่น R-202) และ Subtitle (เช่น (Main Conference))
    const roomNameParts = room.name.match(/^(.*?)\s*\((.*)\)$/);
    const roomCode = roomNameParts ? roomNameParts[1] : room.name;
    const roomSubtitle = roomNameParts ? roomNameParts[2] : room.description;

    return (
        <div className="room-detail-container">
            <h2 className="page-header">
                <span className="room-code">{roomCode}</span> 
                {roomSubtitle && <span className="room-subtitle">({roomSubtitle})</span>}
            </h2>

            <div className="room-meta">
                <p><MapPin className="icon-small" /> สถานที่: {room.location}</p>
                <p><Users className="icon-small" /> ความจุ: {room.capacity} ท่าน</p>
                <p><Info className="icon-small" /> รายละเอียด: {room.description}</p>
                <p>⚙️ อุปกรณ์: {room.equipment || 'ไม่ระบุ'}</p>
            </div>

            <div className="booking-form-card">
                <h3>ทำการจองห้องประชุม</h3>
                
                {error && (
                    <div className="error-message"><AlertTriangle className="icon-error" /> {error}</div>
                )}
                
                {/* 🎯 NEW LAYOUT: Group Date and Time */}
                <div className="form-datetime-group">
                    {/* 1. DATE INPUT */}
                    <div className="form-group">
                        <label><CalendarIcon size={16} className="icon-tiny" /> วันที่จอง</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)} 
                            className="form-input"
                            disabled={isSubmitting}
                            min={new Date().toISOString().substring(0, 10)} // วันที่จองต้องไม่ย้อนหลัง
                        />
                    </div>
                </div>

                <div className="form-datetime-group">
                    {/* 2. START TIME INPUT */}
                    <div className="form-group">
                        <label><ClockIcon size={16} className="icon-tiny" /> เวลาเริ่มต้น</label>
                        <input 
                            type="time" 
                            value={timeStart} 
                            onChange={e => setTimeStart(e.target.value)} 
                            className="form-input"
                            disabled={isSubmitting}
                            step="1800" // 30 นาที
                        />
                    </div>
                    
                    {/* 3. END TIME INPUT */}
                    <div className="form-group">
                        <label><ClockIcon size={16} className="icon-tiny" /> เวลาสิ้นสุด</label>
                        <input 
                            type="time" 
                            value={timeEnd} 
                            onChange={e => setTimeEnd(e.target.value)} 
                            className="form-input"
                            disabled={isSubmitting}
                            step="1800" // 30 นาที
                        />
                    </div>
                </div>
                
                <button 
                    onClick={onBook} 
                    className="btn-primary"
                    disabled={isSubmitting || !timeStart || !timeEnd}
                >
                    {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการจอง'}
                </button>
                
                <p className="note-duration">
                    * ระยะเวลาจองสูงสุด: 3 ชั่วโมง.
                </p>
            </div>
        </div>
    );
}