import React, { useEffect, useState } from 'react';
import { 
    getAllMeetingRooms, 
    createMeetingRoom, 
    updateMeetingRoom, 
    deleteMeetingRoom 
} from '../../api/services/meetingRoomService'; 
// 💡 เพิ่ม icons ที่จำเป็น: Loader, Edit, Check, X, Trash2
import { Trash2, Edit, Check, X, Loader } from 'lucide-react'; 
import './MeetingRoomManagementPage.css';

// สถานะเริ่มต้นสำหรับฟอร์มสร้าง/แก้ไข
const initialFormState = {
    name: '',
    floor: '',
    capacity: '',
    has_projector: false,
    is_available: true,
};

export default function MeetingRoomManagementPage() {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newRoom, setNewRoom] = useState(initialFormState);
    
    // สถานะสำหรับ Inline Editing
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editingRoomData, setEditingRoomData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = () => {
        setIsLoading(true);
        setError(null);
        getAllMeetingRooms()
            .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
            .catch(err => {
                console.error("Failed to fetch meeting rooms:", err);
                setError(err?.response?.data?.message || "Failed to fetch meeting rooms.");
            })
            .finally(() => setIsLoading(false));
    };

    // ------------------- CREATE LOGIC -------------------

    const handleNewRoomChange = e => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setNewRoom({ ...newRoom, [e.target.name]: value });
    };

    const handleCreateRoom = e => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        const dataToSend = { 
            ...newRoom, 
            capacity: parseInt(newRoom.capacity, 10) || 0, // ป้องกัน NaN
        };
        
        // 💡 ตรวจสอบความถูกต้องเบื้องต้น
        if (!dataToSend.name || dataToSend.capacity <= 0) {
            setError("Name and capacity are required.");
            setIsSubmitting(false);
            return;
        }

        createMeetingRoom(dataToSend)
            .then(() => {
                setNewRoom(initialFormState);
                fetchRooms(); 
            })
            .catch(err => {
                setError(err?.response?.data?.message || "Failed to create meeting room.");
            })
            .finally(() => setIsSubmitting(false));
    };

    // ------------------- UPDATE LOGIC -------------------

    const handleEditStart = (room) => {
        setEditingRoomId(room.id);
        // คัดลอกข้อมูลปัจจุบัน (ซึ่งควรเป็น snake_case อยู่แล้วจาก DB)
        setEditingRoomData({ ...room }); 
    };

    const handleEditChange = e => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const name = e.target.name; 
        
        setEditingRoomData({ ...editingRoomData, [name]: value });
    };

    const handleUpdate = (id) => {
        setIsSubmitting(true);
        setError(null);
        
        const dataToSend = { ...editingRoomData };
        
        // แปลง capacity เป็นตัวเลขก่อนส่ง
        if (dataToSend.capacity) {
            dataToSend.capacity = parseInt(dataToSend.capacity, 10);
        }

        updateMeetingRoom(id, dataToSend)
            .then(() => {
                setEditingRoomId(null); 
                setEditingRoomData({});
                fetchRooms(); 
            })
            .catch(err => {
                setError(err?.response?.data?.message || "Failed to update meeting room.");
            })
            .finally(() => setIsSubmitting(false));
    };

    const handleCancelEdit = () => {
        setEditingRoomId(null);
        setEditingRoomData({});
    };

    // ------------------- DELETE LOGIC -------------------
    
    const handleDeleteRoom = id => {
        if (window.confirm("Are you sure you want to delete this meeting room?")) {
            deleteMeetingRoom(id)
                .then(() => fetchRooms())
                .catch(err => {
                    setError(err?.response?.data?.message || "Failed to delete meeting room.");
                });
        }
    };
    
    // ------------------- RENDERING COMPONENTS -------------------

    const RoomRow = ({ room }) => {
        const isEditing = editingRoomId === room.id;
        const data = isEditing ? editingRoomData : room;
        
        // Helper สำหรับดึงค่าที่ถูกต้องจาก data/editingRoomData
        const getValue = (key) => isEditing ? (editingRoomData[key] !== undefined ? editingRoomData[key] : room[key]) : room[key];

        return (
            <tr className={!data.is_available ? 'room-unavailable' : ''}>
                <td>{room.id}</td>
                {/* Name */}
                <td className="editable-cell">
                    {isEditing ? <input type="text" name="name" value={getValue('name') || ''} onChange={handleEditChange} className="inline-input" /> : room.name}
                </td>
                {/* Floor */}
                <td className="editable-cell">
                    {isEditing ? <input type="number" name="floor" value={getValue('floor') || ''} onChange={handleEditChange} className="inline-input" /> : room.floor}
                </td>
                {/* Capacity */}
                <td className="editable-cell">
                    {isEditing ? <input type="number" name="capacity" value={getValue('capacity') || ''} onChange={handleEditChange} className="inline-input" /> : room.capacity}
                </td>
                {/* Projector */}
                <td className="checkbox-cell">
                    <input 
                        type="checkbox" 
                        name="has_projector" 
                        checked={!!getValue('has_projector')}
                        onChange={handleEditChange} 
                        disabled={!isEditing} 
                    />
                    <span className="status-label">
                        {!!data.has_projector ? 'มี' : 'ไม่มี'}
                    </span>
                </td>
                {/* Available */}
                <td className={`status-cell status-${!!data.is_available ? 'available' : 'unavailable'}`}>
                    <input 
                        type="checkbox" 
                        name="is_available" 
                        checked={!!getValue('is_available')}
                        onChange={handleEditChange} 
                        disabled={!isEditing} 
                    />
                    <span className="status-label">
                        {!!data.is_available ? 'พร้อมใช้งาน' : 'ไม่ว่าง'}
                    </span>
                </td>
                {/* Actions */}
                <td>
                    {isEditing ? (
                        <div className="actions-group">
                            <button onClick={() => handleUpdate(room.id)} className="btn-icon btn-save" title="บันทึก" disabled={isSubmitting}>
                                <Check size={16} />
                            </button>
                            <button onClick={handleCancelEdit} className="btn-icon btn-cancel" title="ยกเลิก" disabled={isSubmitting}>
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="actions-group">
                            <button onClick={() => handleEditStart(room)} className="btn-icon btn-edit" title="แก้ไข" disabled={isSubmitting}>
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteRoom(room.id)} className="btn-icon btn-delete" title="ลบ" disabled={isSubmitting}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </td>
            </tr>
        );
    };


    return (
        <div className="admin-management-container">
            <h1 className="page-header">จัดการ Meeting Room</h1>

            {/* Form สำหรับสร้างห้องใหม่ */}
            <div className="card create-form">
                <h3>สร้างห้องประชุมใหม่</h3>
                <form onSubmit={handleCreateRoom} className="form-grid">
                    <input type="text" name="name" placeholder="ชื่อห้อง (เช่น M-101)" value={newRoom.name} onChange={handleNewRoomChange} required disabled={isSubmitting}/>
                    <input type="number" name="floor" placeholder="ชั้น" value={newRoom.floor} onChange={handleNewRoomChange} required disabled={isSubmitting}/>
                    <input type="number" name="capacity" placeholder="ความจุ (คน)" value={newRoom.capacity} onChange={handleNewRoomChange} required disabled={isSubmitting}/>
                    
                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input type="checkbox" name="has_projector" checked={newRoom.has_projector} onChange={handleNewRoomChange} disabled={isSubmitting}/>
                            มีโปรเจคเตอร์
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" name="is_available" checked={newRoom.is_available} onChange={handleNewRoomChange} disabled={isSubmitting}/>
                            พร้อมใช้งาน
                        </label>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isSubmitting || !newRoom.name || !newRoom.capacity}>
                        {isSubmitting ? (
                            <><Loader size={16} className="icon-spin"/> กำลังสร้าง...</>
                        ) : (
                            'สร้าง Meeting Room'
                        )}
                    </button>
                </form>
            </div>


            {/* แสดงผลสถานะ */}
            {error && <p className="error-message">{error}</p>}
            {isLoading && <p className="loading-message"><Loader size={16} className="icon-spin"/> Loading meeting rooms...</p>}
            
            {!isLoading && rooms.length === 0 && (
                <p className="empty-state">No meeting rooms found.</p>
            )}

            {/* ตารางแสดงผล */}
            {!isLoading && rooms.length > 0 && (
                <div className="room-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>ชื่อห้อง</th>
                                <th>ชั้น</th>
                                <th>ความจุ</th>
                                <th>โปรเจคเตอร์</th>
                                <th>สถานะ</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(r => <RoomRow key={r.id} room={r} />)} 
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}