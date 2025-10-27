// D:\MeetingRoomBooking\frontend\src\context\AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
// 🚨 ต้องนำเข้า fetchMe ด้วย เพื่อใช้ดึงข้อมูลผู้ใช้จาก Backend
import { getToken, clearToken, fetchMe } from '../api/authService'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ✨ NEW/ADJUSTED: ฟังก์ชันดึงข้อมูลผู้ใช้จาก API
    // ฟังก์ชันนี้จะถูกเรียกในหน้า Login (หลังจากบันทึก Token) และใน useEffect
    const refetchUser = async () => {
        const token = getToken();
        if (!token) {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setIsLoading(false); // 💡 ต้องปิด Loading ในเงื่อนไขนี้
            return;
        }
        
        // ถ้ามี Token ให้ลองดึงข้อมูลจาก Backend
        try {
            // 🚨 เรียก API: fetchMe() จะใช้ Token ที่มีอยู่เพื่อดึงข้อมูลผู้ใช้
            const res = await fetchMe(); 
            
            // ✅ อัปเดตสถานะด้วยข้อมูลที่สมบูรณ์จาก Backend
            setCurrentUser(res.data); 
            setIsAuthenticated(true);
        } catch (error) {
            // ถ้า Token หมดอายุ (401/403) หรือ API ล้มเหลว
            console.error("Failed to fetch user data, clearing token:", error);
            clearToken();
            setCurrentUser(null);
            setIsAuthenticated(false);
        } finally {
            // 💡 ต้องปิด Loading เสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว
            setIsLoading(false); 
        }
    };


    useEffect(() => {
        // 🚨 เรียกใช้ฟังก์ชัน async ทันทีที่โหลด Context ครั้งแรก
        // (ใช้ IIFE หรือฟังก์ชันที่สร้างขึ้นภายใน useEffect)
        refetchUser();
    }, []);
    
    // 🚨 ลบฟังก์ชัน login เดิมที่ไม่สมบูรณ์ออก (ใช้ login จาก authService.js โดยตรงแทน)
    
    // 🚨 ฟังก์ชัน logout ที่ใช้เรียกจาก Component ต่างๆ
    const logout = () => {
        clearToken(); 
        setCurrentUser(null);
        setIsAuthenticated(false);
        // 💡 ถ้าต้องการให้เด้งไปหน้า login ทันที ให้เรียก nav('/login') ใน Component แทนที่จะทำใน Context
    };

    return (
        <AuthContext.Provider value={{ currentUser, isAuthenticated, isLoading, logout, refetchUser }}>
            {/* 💡 ในคอมโพเนนต์หลักที่ใช้ AuthProvider ควรจัดการแสดง Loader ตรงนี้ */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2em' }}>
                    กำลังตรวจสอบสิทธิ์...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};