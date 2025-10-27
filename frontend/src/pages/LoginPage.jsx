import React, { useState } from 'react';
import { login } from '../api/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    
    const nav = useNavigate();
    const { refetchUser } = useAuth(); // ดึงฟังก์ชันอัปเดต Context

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('กำลังเข้าสู่ระบบ...');
        
        try {
            // 1. เรียก API: ถ้าสำเร็จ จะบันทึก Token ใน localStorage
            await login(email, password);
            
            // 2. อัปเดต Context: รอจนกว่า Context จะดึงข้อมูลผู้ใช้ใหม่และอัปเดตสถานะ
            await refetchUser(); 
            
            // 3. สำเร็จ: ลบ setTimeout และนำทางทันที
            setMessage('เข้าสู่ระบบสำเร็จ! กำลังนำทาง...');
            // 💡 นำทางโดยตรงหลัง Context อัปเดตเสร็จแล้ว
            nav('/'); 
            
        } catch (err) { 
            // 4. ล้มเหลว: จัดการ Error ที่มาจาก API (400, 401, 500)
            setMessage('');
            const apiError = err?.response?.data?.message;

            if (err.response && (err.response.status === 400 || err.response.status === 401)) {
                // 400/401: Invalid Credentials (ตาม Backend ของคุณ)
                setError(apiError || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            } else {
                // Error อื่นๆ (Server Error 500 หรือ Network)
                setError('การเข้าสู่ระบบล้มเหลวเนื่องจากปัญหาเครือข่าย/เซิร์ฟเวอร์');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>เข้าสู่ระบบ</h2>
                
                {error && <div className="error-message">{error}</div>}
                {message && !error && <div className="status-message">{message}</div>}

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">อีเมล</label>
                        <input 
                            id="email"
                            type="email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">รหัสผ่าน</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required
                        />
                    </div>
                    
                    <button type="submit" className="login-button" disabled={message.includes('กำลัง')}>
                        เข้าสู่ระบบ
                    </button>
                </form>

                <p className="register-link">
                    ยังไม่มีบัญชี? <a href="/register">ลงทะเบียน</a>
                </p>
            </div>
        </div>
    );
}