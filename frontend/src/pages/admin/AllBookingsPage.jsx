// D:\MeetingRoomBooking\frontend\src\pages\admin\AllBookingsPage.jsx

import React, { useEffect, useState, useMemo } from 'react'; // 💡 เพิ่ม useMemo
import { getAllBookings } from '../../api/services/bookingService';
import { getRooms } from '../../api/roomService'; // 💡 ต้อง import getRooms ด้วย
import { Filter, Users, MapPin, Clock } from 'lucide-react'; // 💡 Import Icons เพิ่มเติม
import './AllBookingsPage.css'; 

// ------------------- Helper Function: Map Status to English Text and Class -------------------
const mapStatusToEnglish = (status) => {
    const lowerStatus = status ? status.toLowerCase() : 'unknown';
    switch (lowerStatus) {
        case 'booked':
            return { text: 'Booked', tagClass: 'status-booked' };
        case 'in_use':
            return { text: 'In Use', tagClass: 'status-inuse' };
        case 'completed':
            return { text: 'Completed', tagClass: 'status-completed' };
        case 'cancelled':
            return { text: 'Cancelled', tagClass: 'status-cancelled' };
        case 'confirmed':
            return { text: 'Confirmed', tagClass: 'status-confirmed' };
        case 'pending':
            return { text: 'Pending', tagClass: 'status-pending' };
        default:
            return { text: 'Unknown', tagClass: 'status-unknown' };
    }
};

// ⭐ NEW HELPER: แยก Date และ Time
const formatDateTime = (timeString) => {
    if (!timeString) return { date: 'N/A', time: 'N/A' };
    try {
        const date = new Date(timeString);
        
        // Date part: YYYY-MM-DD
        const datePart = date.toISOString().substring(0, 10); 
        
        // Time part: HH:MM
        const timePart = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        return { date: datePart, time: timePart };
    } catch (e) {
        return { date: 'Invalid', time: 'Invalid' };
    }
};

export default function AllBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]); // 💡 เพิ่ม state สำหรับ rooms
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🚀 NEW STATE: สำหรับการกรองข้อมูล
    const [filters, setFilters] = useState({
        user: '',
        room: '', // กรองตามชื่อห้อง
        date: '',
        status: '',
    });

    useEffect(() => {
        setIsLoading(true);
        
        // 1. Fetch Bookings
        const fetchBookings = getAllBookings()
            .then(res => {
                setBookings(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => {
                console.error("Failed to fetch bookings:", err);
                setError("Failed to fetch booking data. Please try again."); 
            });

        // 2. Fetch Rooms (สำหรับใช้ใน Filter Dropdown)
        const fetchRooms = getRooms()
             .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
             .catch(err => console.error("Failed to fetch rooms:", err));

        Promise.all([fetchBookings, fetchRooms])
            .finally(() => setIsLoading(false));

    }, []);

    // 🚀 NEW LOGIC: ฟังก์ชันกรองข้อมูล
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // กรองตาม User Name
            if (filters.user && b.user_name && b.user_name !== filters.user) {
                return false;
            }
            // กรองตาม Room Name
            if (filters.room && b.room_name && b.room_name !== filters.room) {
                return false;
            }
            // กรองตาม Date
            if (filters.date && b.start_time && !b.start_time.startsWith(filters.date)) {
                return false;
            }
            // กรองตาม Status
            if (filters.status && b.status && b.status.toLowerCase() !== filters.status.toLowerCase()) {
                return false;
            }
            return true;
        });
    }, [bookings, filters]);

    // 🚀 NEW LOGIC: สำหรับ Options ใน Filter
    const filterOptions = useMemo(() => {
        const uniqueUsers = [...new Set(bookings.map(b => b.user_name).filter(name => name && name !== 'N/A'))].sort();
        const uniqueStatuses = [...new Set(bookings.map(b => b.status).filter(status => status))];
        return { uniqueUsers, uniqueStatuses };
    }, [bookings]);


    return (
        <div className="bookings-page-container">
            <h1 className="page-header">All Bookings List</h1> 

            {/* Loading, Error, Empty State */}
            {isLoading && <p className="loading-message">Loading bookings...</p>}
            {error && <div className="error-message">Error: {error}</div>}
            
            {!isLoading && !error && bookings.length === 0 && (
                <div className="empty-state">No bookings found</div> 
            )}

            {/* ------------------- FILTER BAR ------------------- */}
            {!isLoading && bookings.length > 0 && (
                <div className="filter-bar">
                    <Filter size={20} className="filter-icon" />
                    
                    {/* 1. Filter User (SELECT Dropdown) */}
                    <select
                        value={filters.user}
                        onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">All Users</option>
                        {filterOptions.uniqueUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                        ))}
                    </select>

                    {/* 2. Filter Room (Select Dropdown) */}
                    <select
                        value={filters.room}
                        onChange={(e) => setFilters(prev => ({ ...prev, room: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">All Rooms</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.name}>{room.name}</option>
                        ))}
                    </select>

                    {/* 3. Filter Date (Date Input) */}
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="filter-input"
                    />

                    {/* 4. Filter Status (Select Dropdown) */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        {filterOptions.uniqueStatuses.map(status => {
                            const statusInfo = mapStatusToEnglish(status);
                            return <option key={status} value={status}>{statusInfo.text}</option>
                        })}
                    </select>
                </div>
            )}
            {/* ------------------- END FILTER BAR ------------------- */}


            {/* Booking Table */}
            {!isLoading && filteredBookings.length > 0 && ( // 💡 ใช้ filteredBookings
                <div className="table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Room</th>
                                <th>Date</th> 
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(b => { // 💡 ใช้ filteredBookings
                                const statusDisplay = mapStatusToEnglish(b.status); 
                                const startDetails = formatDateTime(b.start_time); 
                                const endDetails = formatDateTime(b.end_time); 

                                return (
                                    <tr key={b.id}>
                                        <td>{b.user_name}</td>
                                        <td>{b.room_name}</td>
                                        
                                        <td>{startDetails.date}</td>
                                        
                                        <td>{startDetails.time}</td>
                                        <td>{endDetails.time}</td>
                                        
                                        <td className={`status-cell ${statusDisplay.tagClass}`}>
                                            <span className="status-tag">{statusDisplay.text}</span>
                                        </td>                                
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Empty filter message */}
            {!isLoading && bookings.length > 0 && filteredBookings.length === 0 && (
                 <div className="empty-state">No bookings match the current filters.</div>
            )}
        </div>
    );
}