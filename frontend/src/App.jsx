import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { logout } from './api/authService';
import './App.css';
import Sidebar from './components/Sidebar';

// ✅ Import user pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import BookingCalendarPage from "./pages/BookingCalendarPage.jsx";
import MyBookingsPage from './pages/MyBookingsPage';
import MeetingRoomBookingPage from "./pages/user/MeetingRoomBookingPage.jsx";

// ✅ Import admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AllBookingsPage from './pages/admin/AllBookingsPage';
import RoomManagementPage from './pages/admin/RoomManagementPage';
import MeetingRoomManagementPage from './pages/admin/MeetingRoomManagementPage.jsx'; // ✅ เพิ่มส่วนนี้

// ✅ Logo
import LogoImage from './PSU-Logo-02.png';

export default function App() {
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isUser = isAuthenticated;
  const location = useLocation();

  return (
    <div className="app-container">
      {/* 🔹 Navigation Bar */}
      <nav className="navbar">
        <div className="nav-links-left">
          <Link to="/" className="nav-link nav-link-brand">
            <img src={LogoImage} alt="Meeting Booking Logo" className="nav-logo" />
            MEETING BOOKING
          </Link>

          {isUser && (
            <>
              <span className="nav-separator">|</span>
              <Link to="/meeting-booking" className="nav-link">Home</Link>
            </>
          )}

          {isAdmin && (
            <>
              <span className="nav-separator">|</span>
              <Link to="/admin" className="nav-link">Dashboard</Link>
            </>
          )}
        </div>

        <div>
          {!isAuthenticated ? (
            <Link to="/login" className="nav-link">Login / Sign up</Link>
          ) : (
            <span className="auth-info">
              Welcome, {currentUser?.name || currentUser?.email} ({currentUser?.role})
              <button onClick={logout} className="logout-button">Logout</button>
            </span>
          )}
        </div>
      </nav>

      {/* 🔹 Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <Sidebar
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          currentPath={location.pathname}
        />

        {/* 🔹 Content Area */}
        <div className="content-area">
          <Routes>
            {/* ====================== */}
            {/* 1. PUBLIC ROUTES */}
            {/* ====================== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/room/:id" element={<RoomDetailsPage />} />

            {/* ====================== */}
            {/* 2. USER ROUTES */}
            {/* ====================== */}
            <Route path="/calendar" element={<BookingCalendarPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/meeting-booking" element={<MeetingRoomBookingPage />} />

            {/* ====================== */}
            {/* 3. ADMIN ROUTES */}
            {/* ====================== */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/all-bookings" element={<AllBookingsPage />} />
            <Route path="/admin/room-management" element={<RoomManagementPage />} />
            <Route path="/admin/meeting-room-management" element={<MeetingRoomManagementPage />} />

            {/* ====================== */}
            {/* 4. FALLBACK ROUTE */}
            {/* ====================== */}
            <Route path="*" element={<h2>404 Not Found</h2>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
