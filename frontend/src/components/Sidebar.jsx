import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Calendar, 
    Users, 
    Briefcase, 
    LayoutDashboard, 
    LogOut, 
    DoorOpen, 
    FileText // สำหรับ All Bookings
} from 'lucide-react';

export default function Sidebar() {
    const { currentUser, isAuthenticated, logout } = useAuth();
    
    if (!isAuthenticated) return null;
    const isAdmin = currentUser?.role === 'admin';

    // 1. เมนูสำหรับ User/Employee/Admin
    const menuItems = [
        // Path สำหรับปฏิทินการจอง
        { to: '/calendar', label: 'ปฏิทินการจอง', icon: <Calendar /> },
        // Path สำหรับการจองของฉัน (แก้ไขจาก /MyBookingsPage เป็น /my-bookings)
        { to: '/my-bookings', label: 'รายการจองทั้งหมด', icon: <Briefcase /> },
        // 🆕 เพิ่ม: จอง Meeting Room ใหม่
        { to: '/meeting-booking', label: 'จอง Meeting Room', icon: <DoorOpen /> },
    ];

    // 2. เมนูสำหรับการจัดการ (Admin Only)
    const adminItems = [
        // Path สำหรับหน้า Admin Dashboard
        { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard /> },
        // Path สำหรับการจัดการห้องประชุมเดิม
        { to: '/admin/room-management', label: 'จัดการห้องประชุม', icon: <DoorOpen /> },
        // 🆕 เพิ่ม: จัดการ Meeting Room ใหม่
        // { to: '/admin/meeting-room-management', label: 'อัพเดทสถานะการจอง', icon: <DoorOpen /> },
        // Path สำหรับรายการจองทั้งหมด
        { to: '/admin/all-bookings', label: 'รายการจองทั้งหมด', icon: <FileText /> },
        // (ละเว้น /users เนื่องจากยังไม่มี Controller สำหรับ User Management)
    ];

    return (
        <div className="sidebar">
            <h4 className="sidebar-header">เมนู</h4>
            <div className="sidebar-links">
                {/* User/Employee Menus */}
                {menuItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                    >
                        <span className="link-icon">{item.icon}</span> {item.label}
                    </NavLink>
                ))}

                {/* Admin Menus */}
                {isAdmin && (
                    <>
                        <div className="sidebar-separator">การจัดการ</div>
                        {adminItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                            >
                                <span className="link-icon">{item.icon}</span> {item.label}
                            </NavLink>
                        ))}
                    </>
                )}

                {/* Logout Button */}
                <button className="sidebar-link logout-btn" onClick={logout}>
                    <span className="link-icon"><LogOut /></span> ออกจากระบบ
                </button>
            </div>
        </div>
    );
}
