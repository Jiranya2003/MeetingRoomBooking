import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookings } from '../../api/services/bookingService';
import { getRooms } from '../../api/roomService';
import { Users, BookOpen, Clock, XCircle, MapPin } from 'lucide-react'; // ✨ Import Icons
import './AdminDashboardPage.css';

// ------------------- METRICS CALCULATION -------------------
const getSummaryMetrics = (bookings, rooms) => {
    const totalBookings = bookings.length;
    const totalRooms = rooms.length;
    
    // คำนวณสถานะการจอง
    const statusCounts = bookings.reduce((acc, booking) => {
        const status = booking.status ? booking.status.toLowerCase() : 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    return {
        totalBookings,
        totalRooms,
        confirmedBookings: statusCounts.confirmed || 0,
        pendingBookings: statusCounts.pending || 0,
        cancelledBookings: statusCounts.cancelled || 0,
        
        metrics: [
            { title: "ห้องประชุมทั้งหมด", value: totalRooms, icon: Users, color: '#007bff' },
            { title: "การจองทั้งหมด", value: totalBookings, icon: BookOpen, color: '#28a745' },
            { title: "รออนุมัติ (Pending)", value: statusCounts.pending || 0, icon: Clock, color: '#ffc107' },
            { title: "ถูกยกเลิก (Cancelled)", value: statusCounts.cancelled || 0, icon: XCircle, color: '#dc3545' },
        ]
    };
};

// ------------------- METRICS CARD COMPONENT -------------------
const MetricsCard = ({ title, value, icon: Icon, color }) => (
    <div className="metric-card" style={{ borderLeftColor: color }}>
        <div className="card-content">
            <p className="card-title">{title}</p>
            <h3 className="card-value">{value}</h3>
        </div>
        <div className="card-icon" style={{ backgroundColor: color, opacity: 0.8 }}>
            {Icon && <Icon size={32} color="white" />}
        </div>
    </div>
);


export default function AdminDashboardPage() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(true);

    useEffect(() => {
        // Fetch bookings
        getAllBookings()
            .then(r => setBookings(Array.isArray(r.data) ? r.data : []))
            .catch(err => {
                console.error("Failed to fetch bookings:", err);
                setBookings([]);
            })
            .finally(() => setLoadingBookings(false));

        // Fetch rooms
        getRooms()
            .then(r => setRooms(Array.isArray(r.data) ? r.data : []))
            .catch(err => {
                console.error("Failed to fetch rooms:", err);
                setRooms([]);
            })
            .finally(() => setLoadingRooms(false));
    }, []);

    // ------------------- CALCULATED METRICS -------------------
    const metricsData = useMemo(() => {
        return getSummaryMetrics(bookings, rooms);
    }, [bookings, rooms]);


    // Helper function to format date/time
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const date = new Date(timeString);
            return date.toLocaleString(); 
        } catch (e) {
            return timeString;
        }
    };

    const isLoading = loadingBookings || loadingRooms;

    return (
        <div className="admin-dashboard">
            <h1 className="page-header">Admin Dashboard</h1>
            
            {isLoading && (
                <p className="loading-message">Loading dashboard data...</p>
            )}

            {!isLoading && (
                <>
                    {/* ---------------------------------------------------- */}
                    {/* 1. SUMMARY METRICS (4 CARDS) */}
                    {/* ---------------------------------------------------- */}
                    <div className="chart-grid">
                        {metricsData.metrics.map(metric => (
                            <MetricsCard key={metric.title} {...metric} />
                        ))}
                    </div>
                    
                    {/* ---------------------------------------------------- */}
                    {/* 2. BOOKINGS TABLE */}
                    {/* ---------------------------------------------------- */}
                    <div className="dashboard-section booking-table-section">
                        <h2>Bookings ({bookings.length})</h2>
                        
                        {bookings.length === 0 ? (
                            <p className="empty-message">No bookings found.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>User</th>
                                            <th>Room</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.id}</td>
                                                <td>{b.user_name}</td>
                                                <td>{b.room_name}</td>
                                                <td>{formatTime(b.start_time)}</td>
                                                <td>{formatTime(b.end_time)}</td>
                                                <td className={`status-cell status-${b.status ? b.status.toLowerCase() : 'unknown'}`}>
                                                    {b.status}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    <hr className="section-divider" /> 

                    {/* ---------------------------------------------------- */}
                    {/* 3. ROOMS LIST (ตกแต่งแบบ Card Grid) */}
                    {/* ---------------------------------------------------- */}
                    <div className="dashboard-section rooms-section">
                        <h2>Rooms ({rooms.length})</h2>
                        {rooms.length === 0 ? (
                            <p className="empty-message">No rooms found.</p>
                        ) : (
                            <ul className="room-list room-list-grid">
                                {rooms.map(r => (
                                    <li key={r.id} className="room-item-card">
                                        <div className="room-info-header">
                                            <span className="room-name">{r.name}</span>
                                            <span className={`room-status-tag status-${r.is_available ? 'available' : 'unavailable'}`}>
                                                {r.is_available ? 'ว่าง' : 'ไม่ว่าง'}
                                            </span>
                                        </div>
                                        <div className="room-details-body">
                                            <p className="detail-line"><MapPin size={16} /> สถานที่: <span>{r.location}</span></p>
                                            <p className="detail-line"><Users size={16} /> ความจุ: <span>{r.capacity} ท่าน</span></p>
                                            <p className="detail-line equip-status">
                                                ⚙️ โปรเจคเตอร์: 
                                                <span className={r.has_projector ? 'text-success' : 'text-danger'}>
                                                    {r.has_projector ? 'มี' : 'ไม่มี'}
                                                </span>
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}