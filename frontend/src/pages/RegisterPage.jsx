import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/authService'; 
import './RegisterPage.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState(null); 
    const [message, setMessage] = useState(''); 
    
    const nav = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('กำลังดำเนินการลงทะเบียน...');
        
        // 1. ตรวจสอบรหัสผ่านตรงกัน
        if (password !== confirmPassword) {
            setMessage('');
            setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
            return; 
        }
        
        // 2. ตรวจสอบความยาวรหัสผ่าน (ถ้า Backend มีเงื่อนไข)
        if (password.length < 6) { 
            setMessage('');
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        try {
            // 🚨 การแก้ไขหลัก: ส่งข้อมูลเป็น Object { name, email, password }
            await register({ name, email, password }); 
            
            setMessage('ลงทะเบียนสำเร็จ! กำลังนำทางไปหน้า Login...');
            
            setTimeout(() => {
                nav('/login'); 
            }, 1000);
            
        } catch (err) {
            setMessage('');
            // แสดงข้อความผิดพลาดจาก Backend
            setError(err?.response?.data?.message || 'การลงทะเบียนล้มเหลว กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2>ลงทะเบียน</h2>
                
                {error && <div className="error-message">{error}</div>}
                {message && !error && <div className="status-message">{message}</div>}

                <form onSubmit={onSubmit}>
                    {/* ชื่อ-นามสกุล */}
                    <div className="form-group">
                        <label htmlFor="name">ชื่อ-นามสกุล</label>
                        <input 
                            id="name"
                            type="text"
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required
                        />
                    </div>

                    {/* อีเมล */}
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
                    
                    {/* รหัสผ่าน */}
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

                    {/* ช่องยืนยันรหัสผ่าน */}
                    <div className="form-group">
                        <label htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
                        <input 
                            id="confirm-password"
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required
                        />
                    </div>
                    
                    <button type="submit" className="register-button" disabled={message.includes('กำลัง')}>
                        ลงทะเบียน
                    </button>
                </form>

                <p className="login-link">
                    มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
                </p>
            </div>
        </div>
    );
}