import React, { useEffect, useState, useMemo } from 'react'; 
// ✅ แก้ไข Path: ใช้ ../../ เพื่อเข้าถึง src/api/services/roomService
import { getRooms } from "../api/services/roomService";
import { getExistingBookingsByRoomAndDate } from '../api/services/bookingService'; 
import { Calendar, Clock, MapPin, Loader } from 'lucide-react';
import './BookingCalendarPage.css'; 

// 📌 ฟังก์ชันจำลองการสร้างช่องเวลา
const TIME_SLOT_INTERVAL = 30; // 30 นาทีต่อช่อง
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
            
            let status = 'available';
            const slotStartMs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
            const slotEndMs = endDateTime.getTime();

            for (const booking of existingBookings) {
                // สมมติว่า booking.start_time และ booking.end_time เป็น ISO strings
                const bookingStartMs = new Date(booking.start_time).getTime();
                const bookingEndMs = new Date(booking.end_time).getTime();

                const isOverlapping = 
                    (slotStartMs >= bookingStartMs && slotStartMs < bookingEndMs) || 
                    (slotEndMs > bookingStartMs && slotEndMs <= bookingEndMs);
                
                if (isOverlapping) {
                    // 💡 แก้ไข: ใช้ Optional Chaining เพื่อป้องกัน TypeError
                    const bookingStatus = booking.status?.toLowerCase() ?? 'pending'; 

                    // กำหนดสถานะตามสถานะการจองจริง
                    if (bookingStatus === 'confirmed' || bookingStatus === 'pending') {
                        status = bookingStatus; 
                        break;
                    }
                }
            }
            
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

export default function BookingCalendarPage() {
    // 💡 ไม่ได้ใช้ useAuth ในหน้านี้ แต่ถ้าใช้ให้แก้ Path เป็น '../../context/AuthContext'
    const [allRooms, setAllRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
    const [existingBookings, setExistingBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. ดึงรายการห้องทั้งหมดเมื่อโหลดครั้งแรก
    useEffect(() => {
        getRooms()
            .then(r => {
                const fetchedRooms = Array.isArray(r.data) ? r.data : [];
                setAllRooms(fetchedRooms);
                
                if (fetchedRooms.length > 0) {
                    setSelectedRoomId(fetchedRooms[0].id); 
                }
            })
            .catch(err => {
                console.error("Failed to fetch rooms:", err);
                setError('ไม่สามารถโหลดรายการห้องประชุมได้ (API Error)');
            })
            .finally(() => setIsLoading(false));
    }, []);

    // 2. ดึงรายการจองที่มีอยู่เมื่อห้องหรือวันที่มีการเปลี่ยนแปลง
    useEffect(() => {
        if (!selectedRoomId || !selectedDate) return; 
        
        getExistingBookingsByRoomAndDate({ room_id: selectedRoomId, date: selectedDate })
            .then(r => setExistingBookings(Array.isArray(r.data) ? r.data : []))
            .catch(err => console.error("Failed to fetch existing bookings:", err));
    }, [selectedRoomId, selectedDate]);

    // 3. สร้าง Time Slots
    const timeSlots = useMemo(() => {
        return getTimeSlots(selectedDate, existingBookings);
    }, [selectedDate, existingBookings]);
    
    const currentRoom = allRooms.find(r => r.id === selectedRoomId);

    // --- RENDER STATES ---
    if (isLoading) return <div className="loader-container"><Loader size={24} className="icon-spin" /> กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="error-message page-error">{error}</div>;
    if (allRooms.length === 0) return <div className="empty-state">ไม่พบห้องประชุมที่สามารถจองได้</div>;

    // --- MAIN RENDER ---
    return (
        <div className="calendar-page-container">
            <h1 className="page-header"><Calendar size={28} /> ปฏิทินห้องประชุม</h1>
            
            <div className="controls-section card">
                <div className="control-group">
                    <label><MapPin size={16} /> เลือกห้องประชุม:</label>
                    <select 
                        value={selectedRoomId} 
                        onChange={e => setSelectedRoomId(e.target.value)}
                        className="room-select"
                    >
                        {allRooms.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.name} (ความจุ: {r.capacity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label><Calendar size={16} /> เลือกวันที่:</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)} 
                        className="date-input"
                        min={new Date().toISOString().substring(0, 10)}
                    />
                </div>
                
                {currentRoom && (
                    <p className="room-info">รายละเอียด: {currentRoom.location} | ความจุ {currentRoom.capacity} ท่าน</p>
                )}
            </div>

            <div className="availability-section card">
                <h3>สถานะห้องว่าง ({currentRoom?.name || 'กำลังเลือก'})</h3>
                
                {/* Status Legend */}
                <div className="status-legend">
                    <div className="legend-item"><span className="legend-color available"></span> ว่าง</div>
                    <div className="legend-item"><span className="legend-color status-confirmed"></span> จองแล้ว/อนุมัติ</div>
                    <div className="legend-item"><span className="legend-color status-pending"></span> รอการอนุมัติ</div>
                </div>

                {/* Time Slots Grid */}
                <div className="availability-grid">
                    {timeSlots.map((slot, index) => (
                        <div 
                            key={index} 
                            className={`time-slot ${slot.status}`}
                        >
                            <Clock size={12} className="time-icon" /> {slot.label}
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
    );
}