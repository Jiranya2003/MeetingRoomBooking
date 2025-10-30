// D:\MeetingRoomBooking\frontend\src\pages\MyBookingsPage.jsx

import React, { useEffect, useState } from 'react';
import { getMyBookings, deleteBooking } from '../api/services/bookingService'; 
import { Calendar, Trash2, MapPin, Clock } from 'lucide-react'; 
import './MyBookingsPage.css';

// ------------------------------------------------------------------
// ⭐ แก้ไข: ฟังก์ชันช่วยในการกำหนด Class และข้อความสถานะ (ใช้ค่าจาก Backend)
// ------------------------------------------------------------------
const getStatusInfo = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
        case 'booked': // ⭐ สถานะจองล่วงหน้า (แทน 'confirmed' หรือ 'pending')
            return { tagClass: 'status-booked', text: 'จองแล้ว' };
        case 'in_use': // ⭐ สถานะกำลังใช้งาน
            return { tagClass: 'status-inuse', text: 'กำลังใช้งาน' };
        case 'completed': // สถานะเสร็จสิ้น
            return { tagClass: 'status-completed', text: 'เสร็จสิ้น' };
        case 'cancelled': // สถานะถูกยกเลิก (จากการลบ)
            return { tagClass: 'status-cancelled', text: 'ยกเลิกแล้ว' };
        // หากมีสถานะเพิ่มเติม เช่น REJECTED ให้เพิ่มตรงนี้
        default:
            // นี่คือสาเหตุของ 'Unknown' เดิม
            return { tagClass: 'status-unknown', text: 'ไม่ทราบสถานะ' }; 
    }
};

// 📌 ฟังก์ชันช่วยในการจัดรูปแบบวันที่และช่วงเวลา
const formatBookingTimes = (startIso, endIso) => {
    if (!startIso || !endIso) return { date: 'N/A', startTime: 'N/A', endTime: 'N/A' };
    try {
        const startDate = new Date(startIso);
        const endDate = new Date(endIso);
        
        // จัดรูปแบบวันที่ (DD/MM/YYYY)
        const dateStr = startDate.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        // จัดรูปแบบเวลา (HH:MM)
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const startTimeStr = startDate.toLocaleTimeString('th-TH', timeOptions);
        const endTimeStr = endDate.toLocaleTimeString('th-TH', timeOptions);

        return { 
            date: dateStr, 
            startTime: startTimeStr, 
            endTime: endTimeStr 
        };
    } catch (e) {
        return { date: 'Invalid Date', startTime: 'N/A', endTime: 'N/A' };
    }
};


export default function MyBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = () => {
        setIsLoading(true);
        setError(null);
        getMyBookings()
            .then(res => {
                setBookings(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => {
                console.error("Failed to load user bookings:", err);
                // 🚨 ปรับปรุง: ดึงข้อความ error จาก Server ถ้ามี
                const errorMessage = err?.response?.data?.message || `Failed to load your bookings.`;
                setError(errorMessage);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleDelete = (id, currentStatusText) => {
        const currentStatus = currentStatusText.toLowerCase();

        // ⭐ การแก้ไข: อนุญาตให้ยกเลิกได้เฉพาะ 'จองแล้ว' (BOOKED)
        // เนื่องจาก Backend มีการตรวจสอบเวลา canCancelBooking(booking) อีกชั้นหนึ่ง
        if (currentStatus !== 'จองแล้ว') { 
            alert(`ไม่สามารถยกเลิกการจองที่สถานะเป็น ${currentStatus} ได้`);
            return;
        }

        if (window.confirm('คุณต้องการยกเลิกการจองนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            deleteBooking(id)
                .then(() => {
                    alert('ยกเลิกการจองสำเร็จ');
                    fetchBookings(); // Reload bookings list
                })
                .catch(err => {
                    console.error(err);
                    // 🚨 การแก้ไข: ดึงข้อความ error จาก Server เช่น "ไม่สามารถยกเลิกได้เนื่องจากใกล้ถึงเวลาเริ่มแล้ว"
                    const errorMessage = err?.response?.data?.message || 'ไม่สามารถยกเลิกการจองได้ (Server Error)';
                    alert(errorMessage);
                });
        }
    };
    
    return (
        <div className="my-bookings-container">
            <h1 className="page-header"><Calendar size={28} /> My Bookings</h1>

            {isLoading && <p className="loading-message">กำลังโหลดรายการจองของคุณ...</p>}
            {error && <div className="error-message">{error}</div>}

            {!isLoading && bookings.length === 0 && <p className="empty-state">คุณยังไม่มีรายการจอง</p>}

            {!isLoading && bookings.length > 0 && (
                <div className="table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Room Name</th>
                                <th>Date</th>
                                <th>Time</th>
                                {/* <th>สถานะ</th> */}
                                <th className="action-header">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => {
                                // 🎯 การแก้ไข: ใช้ฟังก์ชัน getStatusInfo ที่ปรับปรุงแล้ว
                                const times = formatBookingTimes(b.start_time, b.end_time);
                                const statusInfo = getStatusInfo(b.status);
                                
                                // อนุญาตให้ยกเลิกได้เฉพาะ 'จองแล้ว' (BOOKED)
                                const isCancellable = statusInfo.text === 'จองแล้ว';

                                return (
                                    <tr 
                                        key={b.id} 
                                        className={`booking-row ${statusInfo.tagClass}`}
                                    >
                                        
                                        <td><MapPin size={16} className="icon-inline" /> {b.room_name || 'N/A'}</td>
                                        
                                        {/* 🎯 แสดงวันที่ */}
                                        <td><Calendar size={16} className="icon-inline" /> {times.date}</td>
                                        
                                        {/* 🎯 แสดงช่วงเวลา */}
                                        <td><Clock size={16} className="icon-inline" /> {times.startTime} - {times.endTime}</td>
                                        
                                        {/* <td className="status-cell">
                                            <span className={`status-tag ${statusInfo.tagClass}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td> */}
                                        
                                        <td className="action-cell">
                                            {isCancellable ? ( 
                                                <button
                                                    // ส่ง statusInfo.text ('จองแล้ว') ไปเพื่อใช้ในการตรวจสอบ Alert
                                                    onClick={() => handleDelete(b.id, statusInfo.text)} 
                                                    className="btn-cancel-booking"
                                                >
                                                    <Trash2 size={16} /> ยกเลิก
                                                </button>
                                            ) : (
                                                <span className="text-muted">{statusInfo.text}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}