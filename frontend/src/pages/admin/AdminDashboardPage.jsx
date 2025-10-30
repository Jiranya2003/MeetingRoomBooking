import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookings } from '../../api/services/bookingService';
import { getRooms } from '../../api/roomService';
import { Users, BookOpen, Clock, XCircle, MapPin, Filter, CheckCircle, Clock4, Check } from 'lucide-react'; 
import './AdminDashboardPage.css';

// ------------------- NEW SIMPLIFIED HELPER FUNCTIONS -------------------
const formatDateDetails = (timeString) => {
    if (!timeString) return { datePart: 'N/A', timePart: 'N/A' };
    try {
        const date = new Date(timeString);
        
        // Date part: YYYY-MM-DD
        const datePart = date.toISOString().substring(0, 10); 
        
        // Time part: HH:MM (ใช้ th-TH เพื่อคงรูปแบบเวลาตามบริบทเดิม)
        const timePart = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        // คืนค่าเฉพาะ วันที่ และ เวลา
        return { datePart, timePart };
    } catch (e) {
        return { datePart: 'Invalid', timePart: 'Invalid' };
    }
};
// ------------------- END NEW SIMPLIFIED HELPER FUNCTIONS -------------------

// ------------------- METRICS CALCULATION (แก้ไขเพื่อลบ Pending/Cancelled) -------------------
const getSummaryMetrics = (bookings, rooms) => {
    const totalBookings = bookings.length;
    const totalRooms = rooms.length;
    
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
        completedBookings: statusCounts.completed || 0,
        inUseBookings: statusCounts.in_use || 0,
        
        metrics: [
            { title: "ห้องประชุมทั้งหมด", value: totalRooms, icon: Users, color: '#007bff' },
            { title: "การจองทั้งหมด", value: totalBookings, icon: BookOpen, color: '#28a745' },
            // ❌ REMOVED: { title: "รออนุมัติ (Pending)", value: statusCounts.pending || 0, icon: Clock, color: '#ffc107' },
            // 🚀 กำลังใช้งาน
            { title: "กำลังใช้งาน (In Use)", value: statusCounts.in_use || 0, icon: Clock4, color: '#3b82f6' }, // สีฟ้า/น้ำเงิน
            // 🚀 เสร็จสิ้นแล้ว
            { title: "เสร็จสิ้นแล้ว (Completed)", value: statusCounts.completed || 0, icon: CheckCircle, color: '#4b5563' }, // สีเทาเข้ม
            // ❌ REMOVED: { title: "ถูกยกเลิก (Cancelled)", value: statusCounts.cancelled || 0, icon: XCircle, color: '#dc3545' },
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

    // STATE: สำหรับการกรองข้อมูล
    const [filters, setFilters] = useState({
        user: '',
        room: '',
        date: '',
        status: '',
    });

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

    // LOGIC: ฟังก์ชันกรองข้อมูล
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (filters.user && b.user_name && b.user_name !== filters.user) {
                return false;
            }
            if (filters.room && b.room_name && b.room_name !== filters.room) {
                return false;
            }
            if (filters.date && b.start_time && !b.start_time.startsWith(filters.date)) {
                return false;
            }
            if (filters.status && b.status && b.status.toLowerCase() !== filters.status.toLowerCase()) {
                return false;
            }
            return true;
        });
    }, [bookings, filters]);

    // LOGIC: สำหรับ Options ใน Filter
    const filterOptions = useMemo(() => {
        const uniqueUsers = [...new Set(bookings.map(b => b.user_name).filter(name => name && name !== 'N/A'))].sort();
        const uniqueStatuses = [...new Set(bookings.map(b => b.status).filter(status => status))];
        return { uniqueUsers, uniqueStatuses };
    }, [bookings]);

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
                    {/* 2. BOOKINGS TABLE AND FILTER BAR */}
                    {/* ---------------------------------------------------- */}
                    <div className="dashboard-section booking-table-section">
                        <h2>Bookings ({filteredBookings.length} of {bookings.length})</h2>
                          <div className="filter-bar">
                            <Filter size={20} className="filter-icon" />
                            
                            {/* 1. Filter User (SELECT Dropdown) */}
                            <select
                                value={filters.user}
                                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">ทั้งหมด (User)</option>
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
                                <option value="">ทั้งหมด (ห้อง)</option>
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
                                <option value="">ทั้งหมด (สถานะ)</option>
                                {filterOptions.uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        
                        
                        {filteredBookings.length === 0 ? (
                            <p className="empty-message">ไม่พบรายการจองที่ตรงกับตัวกรอง</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Room</th>
                                            <th>Title</th> 
                                            <th>Date</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map(b => {
                                            const startDetails = formatDateDetails(b.start_time);
                                            const endDetails = formatDateDetails(b.end_time);

                                            return (
                                            <tr key={b.id}>
                                                <td>{b.user_name || 'N/A'}</td>
                                                <td>{b.room_name || 'N/A'}</td>
                                                <td>{b.title || 'No Title'}</td>
                                                <td>{startDetails.datePart}</td> 
                                                <td>{startDetails.timePart}</td> 
                                                <td>{endDetails.timePart}</td>
                                                <td className={`status-cell status-${b.status ? b.status.toLowerCase() : 'unknown'}`}>
                                                    {b.status}
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    <hr className="section-divider" /> 

                </>
            )}
        </div>
    );
}