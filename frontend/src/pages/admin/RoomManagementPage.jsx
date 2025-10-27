// D:\MeetingRoomBooking\frontend\src\pages/admin/RoomManagementPage.jsx

import React, { useEffect, useState } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../api/roomService';
import { Trash2, Plus } from 'lucide-react'; // ✨ นำเข้า Icon
import './RoomManagementPage.css'; // ✨ Import CSS file

export default function RoomManagementPage() {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ฟอร์มสร้างห้องใหม่
    const [newRoom, setNewRoom] = useState({
        name: '',
        location: '',
        capacity: '',
        description: '',
        equipment: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = () => {
        setIsLoading(true);
        setError(null);
        getRooms()
            .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
            .catch(err => setError("Failed to fetch rooms"))
            .finally(() => setIsLoading(false));
    };

    const handleInputChange = e => {
        setNewRoom({ ...newRoom, [e.target.name]: e.target.value });
    };

    const handleCreateRoom = e => {
        e.preventDefault();
        // แปลง Capacity เป็นตัวเลขก่อนส่ง
        const dataToSend = { ...newRoom, capacity: parseInt(newRoom.capacity, 10) };

        createRoom(dataToSend)
            .then(() => {
                setNewRoom({ name: '', location: '', capacity: '', description: '', equipment: '' });
                fetchRooms(); // reload rooms
            })
            .catch(err => {
                setError(err?.response?.data?.message || "Failed to create room.");
                console.error("Failed to create room:", err);
            });
    };

    const handleDeleteRoom = id => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            deleteRoom(id)
                .then(() => fetchRooms())
                .catch(err => {
                    setError(err?.response?.data?.message || "Failed to delete room.");
                    console.error("Failed to delete room:", err);
                });
        }
    };

    return (
        <div className="room-management-container">
            <h1 className="page-header">Room Management</h1>

            {/* Form สำหรับสร้างห้องใหม่ */}
            <div className="card create-form-section">
                <h3>Create New Room</h3>
                <form onSubmit={handleCreateRoom} className="create-form-grid">
                    <input type="text" name="name" placeholder="Name" value={newRoom.name} onChange={handleInputChange} required className="form-input" />
                    <input type="text" name="location" placeholder="Location" value={newRoom.location} onChange={handleInputChange} required className="form-input" />
                    <input type="number" name="capacity" placeholder="Capacity" value={newRoom.capacity} onChange={handleInputChange} required className="form-input" />
                    <input type="text" name="description" placeholder="Description" value={newRoom.description} onChange={handleInputChange} className="form-input" />
                    <input type="text" name="equipment" placeholder="Equipment" value={newRoom.equipment} onChange={handleInputChange} className="form-input" />
                    <button type="submit" className="btn-create">
                        <Plus size={18} /> Create Room
                    </button>
                </form>
            </div>


            {/* แสดงผลสถานะ */}
            {isLoading && <p className="loading-message">Loading rooms...</p>}
            {error && <p className="error-message">{error}</p>}

            {!isLoading && rooms.length === 0 && <p className="empty-state">No rooms found.</p>}

            {/* ตารางแสดงผล */}
            {!isLoading && rooms.length > 0 && (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Capacity</th>
                                <th>Description</th>
                                <th>Equipment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(r => (
                                <tr key={r.id}>
                                    <td>{r.id}</td>
                                    <td>{r.name}</td>
                                    <td>{r.location}</td>
                                    <td>{r.capacity}</td>
                                    <td>{r.description}</td>
                                    <td>{r.equipment}</td>
                                    <td>
                                      <button 
                                        onClick={() => handleDeleteRoom(r.id)} 
                                        className="btn-icon btn-delete"
                                      >
                                        <Trash2 size={16} /> Delete
                                      </button>
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