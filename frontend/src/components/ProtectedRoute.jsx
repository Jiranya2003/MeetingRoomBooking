import React, { useEffect, useState } from 'react';
import { getRooms } from '../api/roomService';
import { Link } from 'react-router-dom';

export default function HomePage(){
  const [rooms, setRooms] = useState([]);
  
  // สถานะสำหรับติดตามว่ากำลังโหลดอยู่หรือไม่
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    setIsLoading(true);
    getRooms()
      .then(r => {
        // 🚨 SAFETY CHECK: ตรวจสอบว่า r.data เป็น Array ก่อนนำไปใช้
        setRooms(Array.isArray(r.data) ? r.data : []);
      })
      .catch(err => {
        console.error("API Call Failed or Response Format Error:", err);
        setRooms([]); // ตั้งเป็น Array ว่าง เพื่อป้องกัน Crash
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
  // ตรวจสอบว่ามี Array สำหรับแสดงผล
  const displayRooms = Array.isArray(rooms) ? rooms : []; 

  return (
    <div>
      <h2>Rooms</h2> {/* ⬅️ หัวข้อนี้ควรจะแสดงแล้ว */}
      
      {isLoading && <p>Loading room data...</p>}
      
      {/* 🚨 ข้อความแจ้งสถานะเมื่อโหลดเสร็จแล้ว */}
      {!isLoading && displayRooms.length === 0 && (
          <p>No rooms found. Please check your database or API service.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {/* ใช้งาน .map() ได้อย่างปลอดภัย */}
        {!isLoading && displayRooms.map(r => (
          <div key={r.id} style={{ border: '1px solid #ccc', padding: 10 }}>
            <h4>{r.name}</h4>
            <p>{r.location}</p>
            <p>Capacity: {r.capacity}</p>
            <Link to={`/room/${r.id}`}>Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
