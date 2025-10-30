import React, { useEffect, useState, useMemo } from 'react'; 
// ✅ แก้ไข Path: ใช้ ../../ เพื่อเข้าถึง src/api/services/roomService
import { getRooms } from "../api/services/roomService";
// 🎯 เพิ่ม createBooking เพื่อใช้ในการส่งคำขอจอง
import { getExistingBookingsByRoomAndDate, createBooking } from '../api/services/bookingService'; 
// 🎯 เพิ่ม CheckCircle เพื่อใช้ใน Modal แจ้งเตือนสำเร็จ
import { Calendar, Clock, MapPin, Loader, CheckCircle, X } from 'lucide-react'; 
import './BookingCalendarPage.css'; 
// 💡 สมมติว่ามี AuthContext เพื่อดึง userId หรือ email ผู้ใช้ปัจจุบัน
// import { useAuth } from '../../context/AuthContext'; 

// 📌 ฟังก์ชันจำลองการสร้างช่องเวลา
const TIME_SLOT_INTERVAL = 30; // 30 นาทีต่อช่อง

const getTimeSlots = (startDate, existingBookings) => {
    const slots = [];
    const dateStr = startDate;
    const startHour = 8;
    const endHour = 18; 

    // หาเวลาปัจจุบัน เพื่อปิดช่องเวลาที่ผ่านไปแล้วในวันปัจจุบัน
    const now = new Date();
    const isToday = startDate === now.toISOString().substring(0, 10);
    
    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += TIME_SLOT_INTERVAL) {
            const startHours = String(h).padStart(2, '0');
            const startMinutes = String(m).padStart(2, '0');
            
            let startDateTime = new Date(`${dateStr}T${startHours}:${startMinutes}:00`);
            let endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + TIME_SLOT_INTERVAL);
            
            const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
            const startTimeStr = `${startHours}:${startMinutes}`;
            
            let status = 'available';
            
            // 💡 NEW: ตรวจสอบว่าช่องเวลานี้ได้ผ่านไปแล้วหรือไม่
            if (isToday && endDateTime < now) {
                status = 'passed';
            }

            const slotStartMs = startDateTime.getTime();
            const slotEndMs = endDateTime.getTime();

            for (const booking of existingBookings) {
                // สมมติว่า booking.start_time และ booking.end_time เป็น ISO strings
                const bookingStartMs = new Date(booking.start_time).getTime();
                const bookingEndMs = new Date(booking.end_time).getTime();

                // ตรวจสอบการทับซ้อน
                const isOverlapping = 
                    (slotStartMs >= bookingStartMs && slotStartMs < bookingEndMs) || 
                    (slotEndMs > bookingStartMs && slotEndMs <= bookingEndMs) ||
                    // กรณีที่ช่วงจองครอบคลุมทั้ง Slot (เกิดขึ้นได้ยากเมื่อ Slot interval คงที่)
                    (slotStartMs < bookingStartMs && slotEndMs > bookingEndMs);
                
                if (isOverlapping) {
                    const bookingStatus = booking.status?.toLowerCase() ?? 'pending'; 

                    if (bookingStatus === 'confirmed' || bookingStatus === 'pending' || bookingStatus === 'booked' || bookingStatus === 'in_use') {
                        // กำหนดสถานะตามสถานะการจองจริง และจัดลำดับความสำคัญให้สถานะจองแล้ว
                        status = bookingStatus === 'confirmed' || bookingStatus === 'booked' || bookingStatus === 'in_use' ? 'confirmed' : 'pending';
                        break;
                    }
                }
            }
            
            slots.push({
                startTime: startTimeStr,
                endTime: endTimeStr,
                startISO: startDateTime.toISOString(),
                endISO: endDateTime.toISOString(),
                label: `${startTimeStr} - ${endTimeStr}`,
                status: status
            });
        }
    }
    return slots;
};

const BookingModal = ({ isOpen, onClose, slot, room, onConfirm, bookingTitle, setBookingTitle, isLoading }) => {
    if (!isOpen || !slot || !room) return null;

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return (
        <div className="booking-modal-overlay">
            <div className="booking-modal card">
                <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
                <h2 className="modal-header">รายละเอียดการจองห้องประชุม</h2>
                
                <div className="modal-details">
                    <p><MapPin size={16} className="icon-detail" /> <strong>ห้อง:</strong> {room.name}</p>
                    <p><Calendar size={16} className="icon-detail" /> <strong>วันที่:</strong> {formatDate(slot.startISO)}</p>
                    <p><Clock size={16} className="icon-detail" /> <strong>เวลา:</strong> {formatTime(slot.startISO)} - {formatTime(slot.endISO)}</p>
                </div>

                {/* <div className="control-group modal-title-input">
                    <label htmlFor="booking-title">หัวข้อ/วัตถุประสงค์การจอง (จำเป็น):</label>
                    <input
                        id="booking-title"
                        type="text"
                        value={bookingTitle}
                        onChange={e => setBookingTitle(e.target.value)}
                        placeholder="เช่น ประชุมทีมโปรเจกต์ A, สัมภาษณ์งาน"
                        className="text-input"
                    />
                </div>
 */}
                {/* <div className="modal-actions">
                    <button 
                        onClick={onConfirm} 
                        disabled={!bookingTitle.trim() || isLoading}
                        className="btn-primary"
                    >
                        {isLoading ? (
                            <>
                                <Loader size={16} className="icon-spin" /> กำลังดำเนินการ...
                            </>
                        ) : (
                            'ยืนยันการจอง'
                        )}
                    </button>
                    <button onClick={onClose} className="btn-secondary" disabled={isLoading}>ยกเลิก</button>
                </div>
                {!bookingTitle.trim() && <p className="error-message">กรุณาระบุหัวข้อการจอง</p>} */}
            </div>
        </div>
    );
};

export default function BookingCalendarPage() {
    // 💡 สมมติว่าผู้ใช้ปัจจุบันมี user object เช่น { id: 'user-id-123' }
    // const { user } = useAuth();
    const mockUserId = 'user-mock-123'; // 🎯 ใช้ ID จำลองจนกว่าจะมี Auth Context

    const [allRooms, setAllRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
    const [existingBookings, setExistingBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // --- NEW BOOKING STATES ---
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingTitle, setBookingTitle] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

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
        
        // ล้างข้อความแจ้งเตือนเมื่อมีการเปลี่ยนเงื่อนไข
        setSuccessMessage('');
        setErrorMessage('');
        
        getExistingBookingsByRoomAndDate({ room_id: selectedRoomId, date: selectedDate })
            .then(r => setExistingBookings(Array.isArray(r.data) ? r.data : []))
            .catch(err => console.error("Failed to fetch existing bookings:", err));
    }, [selectedRoomId, selectedDate]);

    // 3. สร้าง Time Slots
    const timeSlots = useMemo(() => {
        return getTimeSlots(selectedDate, existingBookings);
    }, [selectedDate, existingBookings]);
    
    const currentRoom = allRooms.find(r => r.id === selectedRoomId);

    // --- NEW: HANDLE SLOT SELECTION ---
    const handleSlotClick = (slot) => {
        if (slot.status === 'available') {
            setSelectedSlot(slot);
            setBookingTitle(''); 
            setSuccessMessage('');
            setErrorMessage('');
            setIsBookingModalOpen(true);
        } else {
            setErrorMessage(`ช่วงเวลา ${slot.label}  ${slot.status.toUpperCase()}`);
        }
    };
    
    // --- NEW: HANDLE CONFIRM BOOKING ---
    const handleConfirmBooking = async () => {
        if (!mockUserId) { // user?.id
            setErrorMessage('กรุณาเข้าสู่ระบบเพื่อทำการจอง');
            return;
        }
        if (!bookingTitle.trim()) {
            setErrorMessage('กรุณาระบุหัวข้อการจอง');
            return;
        }

        setIsBookingLoading(true);
        setErrorMessage('');

        const bookingData = {
            user_id: mockUserId, 
            room_id: selectedRoomId,
            start_time: selectedSlot.startISO,
            end_time: selectedSlot.endISO,
            title: bookingTitle.trim(),
        };

        try {
            const response = await createBooking(bookingData);
            setSuccessMessage(response.message || 'การจองสำเร็จ! กรุณารออีเมลยืนยัน');
            
            // รีเฟรชรายการจอง
            const refreshResponse = await getExistingBookingsByRoomAndDate({ room_id: selectedRoomId, date: selectedDate });
            setExistingBookings(Array.isArray(refreshResponse.data) ? refreshResponse.data : []);

            setIsBookingModalOpen(false);
            setSelectedSlot(null);
            setBookingTitle('');
        } catch (err) {
            console.error("Booking failed:", err);
            setErrorMessage(err.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง: ' + (err.message || 'Server error'));
        } finally {
            setIsBookingLoading(false);
        }
    };

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
            
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="alert success-alert">
                    <CheckCircle size={20} /> {successMessage}
                    <button className="alert-close" onClick={() => setSuccessMessage('')}><X size={16} /></button>
                </div>
            )}
            {errorMessage && (
                <div className="alert error-alert">
                    <X size={20} /> {errorMessage}
                    <button className="alert-close" onClick={() => setErrorMessage('')}><X size={16} /></button>
                </div>
            )}


            <div className="availability-section card">
                <h3>สถานะห้อง ({currentRoom?.name || 'กำลังเลือก'})</h3>
                
                {/* Status Legend */}
                <div className="status-legend">
                    <div className="legend-item"><span className="legend-color available"></span> ว่าง </div>
                    <div className="legend-item"><span className="legend-color status-confirmed"></span> จองแล้ว</div>    
                    <div className="legend-item"><span className="legend-color status-past"></span> หมดเวลาแล้ว</div>            
                </div>

                <div className="availability-grid">
                    {timeSlots.map((slot, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleSlotClick(slot)}
                            className={`time-slot status-${slot.status}`}
                        >
                            <Clock size={12} className="time-icon" /> {slot.label}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Booking Confirmation Modal */}
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                slot={selectedSlot}
                room={currentRoom}
                onConfirm={handleConfirmBooking}
                bookingTitle={bookingTitle}
                setBookingTitle={setBookingTitle}
                isLoading={isBookingLoading}
            />
        </div>
    );
}
