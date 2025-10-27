import React, { useEffect, useState } from 'react';
import { getRooms } from '../api/roomService';
import { Link } from 'react-router-dom';
import './HomePage.css';
// import Sidebar from './components/Sidebar';

const RoomCard = ({ room }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    
    let cardClasses = "room-card";
    if (isHovered) {
        cardClasses += " hovered";
    }
    
    const activeStyle = isClicked ? { opacity: 0.8 } : {};

    const handleMouseUp = () => {
        setIsClicked(false);
    };

    const handleMouseDown = () => {
        setIsClicked(true);
    };

    return (
        <div 
            className={cardClasses + (isClicked ? " clicked" : "")} 
            style={activeStyle} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <h4 className="card-title">{room.name}</h4>
            <p className="card-location">{room.location}</p>
            <p className="card-capacity">จำนวน: {room.capacity} คน</p>
            <Link 
                to={`/room/${room.id}`} 
                className="btn-details"
            >รายละเอียด / การจอง</Link>
        </div>
    );
};

export default function HomePage(){
    const [rooms, setRooms] = useState([]);
    
    useEffect(() => {
        getRooms()
        .then(r => {
            setRooms(Array.isArray(r.data) ? r.data : []);
        })
        .catch(err => {
            console.error("API Call Failed:", err);
            setRooms([]); 
        });
    }, []);
    
    const displayRooms = Array.isArray(rooms) ? rooms : []; 

    return (
        <div className="homepage-container">
            <h2 className="page-header">ห้องประชุมทั้งหมด</h2> 

            {displayRooms.length === 0 && (
                <p className="status-message">กำลังโหลดห้อง... หรือไม่พบห้อง (กรุณาตรวจสอบฐานข้อมูล & บันทึก Backend).</p>
            )}
            
            <div className="room-grid">
                {displayRooms.map(r => (
                    <RoomCard key={r.id} room={r} />
                ))}
            </div>
        </div>
    );
}