// D:\MeetingRoomBooking\frontend\src\pages\MyBookingsPage.jsx

import React, { useEffect, useState } from 'react';
import { getMyBookings, deleteBooking } from '../api/services/bookingService'; 
import { Calendar, Trash2, MapPin, Clock } from 'lucide-react'; 
import './MyBookingsPage.css';

// 📌 ฟังก์ชันช่วยในการกำหนด Class และข้อความสถานะ
const getStatusInfo = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
        case 'confirmed':
            return { tagClass: 'status-confirmed', text: 'Confirmed' };
        case 'pending':
            return { tagClass: 'status-pending', text: 'Pending' };
        case 'completed':
            return { tagClass: 'status-completed', text: 'Completed' };
        case 'cancelled':
            return { tagClass: 'status-cancelled', text: 'Cancelled' };
        case 'rejected':
            return { tagClass: 'status-rejected', text: 'Rejected' };
        default:
            return { tagClass: 'status-unknown', text: 'Unknown' };
    }
};

// 📌 ฟังก์ชันช่วยในการจัดรูปแบบวันที่และช่วงเวลา
const formatBookingTimes = (startIso, endIso) => {
    if (!startIso || !endIso) return { date: 'N/A', startTime: 'N/A', endTime: 'N/A' };
    try {
        const startDate = new Date(startIso);
        const endDate = new Date(endIso);
        
        // จัดรูปแบบวันที่ (DD/MM/YYYY)
        const dateStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        // จัดรูปแบบเวลา (HH:MM)
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const startTimeStr = startDate.toLocaleTimeString('en-GB', timeOptions);
        const endTimeStr = endDate.toLocaleTimeString('en-GB', timeOptions);

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
                // 🚨 แสดงข้อความ Error ที่ชัดเจน
                setError(`Failed to load your bookings: ${err.message}`);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleDelete = (id, currentStatusText) => {
        const currentStatus = currentStatusText.toLowerCase();

        // อนุญาตให้ยกเลิกได้เฉพาะ Pending และ Confirmed
        if (currentStatus === 'completed' || currentStatus === 'rejected' || currentStatus === 'cancelled') {
            alert(`Cannot cancel a booking that is already ${currentStatus}.`);
            return;
        }

        if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            deleteBooking(id)
                .then(() => {
                    alert('Booking cancelled successfully.');
                    fetchBookings(); // Reload bookings list
                })
                .catch(err => {
                    console.error(err);
                    alert(err?.response?.data?.message || 'Failed to cancel booking.');
                });
        }
    };
    
    return (
        <div className="my-bookings-container">
            <h1 className="page-header"><Calendar size={28} /> My Bookings</h1>

            {isLoading && <p className="loading-message">Loading your bookings...</p>}
            {error && <div className="error-message">{error}</div>}

            {!isLoading && bookings.length === 0 && <p className="empty-state">You have no bookings yet.</p>}

            {!isLoading && bookings.length > 0 && (
                <div className="table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Room Name</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th className="action-header">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => {
                                // 🎯 การแก้ไข: ใช้ฟังก์ชัน formatBookingTimes ใหม่
                                const times = formatBookingTimes(b.start_time, b.end_time);
                                const statusInfo = getStatusInfo(b.status);
                                
                                // อนุญาตให้ยกเลิกได้หากสถานะยังไม่ใช่ Completed, Cancelled หรือ Rejected
                                const isCancellable = statusInfo.text === 'Pending' || statusInfo.text === 'Confirmed';

                                return (
                                    <tr 
                                        key={b.id} 
                                        className={`booking-row ${statusInfo.tagClass}`}
                                    >
                                        <td>{b.id}</td>
                                        <td><MapPin size={16} className="icon-inline" /> {b.room_name || 'N/A'}</td>
                                        
                                        {/* 🎯 แสดงวันที่ */}
                                        <td><Calendar size={16} className="icon-inline" /> {times.date}</td>
                                        
                                        {/* 🎯 แสดงช่วงเวลา */}
                                        <td><Clock size={16} className="icon-inline" /> {times.startTime} - {times.endTime}</td>
                                        
                                        <td className="status-cell">
                                            <span className={`status-tag ${statusInfo.tagClass}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="action-cell">
                                            {isCancellable ? ( 
                                                <button
                                                    // ส่ง statusInfo.text (Confirmed/Pending) ไปยัง handleDelete
                                                    onClick={() => handleDelete(b.id, statusInfo.text)} 
                                                    className="btn-cancel-booking"
                                                >
                                                    <Trash2 size={16} /> Cancel
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