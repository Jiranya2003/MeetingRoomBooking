// D:\MeetingRoomBooking\frontend\src\pages\admin\AllBookingsPage.jsx

import React, { useEffect, useState } from 'react';
import { getAllBookings } from '../../api/services/bookingService';
import './AllBookingsPage.css'; // ✨ Import CSS file

export default function AllBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        getAllBookings()
            .then(res => {
                setBookings(Array.isArray(res.data) ? res.data : []);
                setError(null);
            })
            .catch(err => {
                console.error("Failed to fetch bookings:", err);
                setError("Cannot fetch bookings. Please try again later.");
                setBookings([]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Helper function to format date/time (optional, but good practice)
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const date = new Date(timeString);
            // Format to a readable string (e.g., DD/MM/YYYY HH:mm)
            return date.toLocaleString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            return timeString;
        }
    };

    return (
        <div className="bookings-page-container"> {/* Main container class */}
            <h1 className="page-header">All Bookings</h1> {/* Changed to h1 for main title */}

            {/* Loading, Error, Empty State */}
            {isLoading && <p className="loading-message">Loading bookings...</p>}
            {error && <div className="error-message">{error}</div>}
            
            {!isLoading && !error && bookings.length === 0 && (
                <div className="empty-state">No bookings found.</div>
            )}

            {/* Booking Table */}
            {!isLoading && bookings.length > 0 && (
                <div className="table-wrapper"> {/* For responsive horizontal scrolling */}
                    <table className="bookings-table">
                        <thead>
                            <tr> {/* No more inline style */}
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
                                    {/* Use class for status styling */}
                                    <td className={`status-cell status-${b.status ? b.status.toLowerCase() : 'pending'}`}>
                                        <span className="status-tag">{b.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}