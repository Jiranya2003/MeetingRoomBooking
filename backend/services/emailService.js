// D:\MeetingRoomBooking\backend\services\emailService.js

const nodemailer = require('nodemailer');

// 💡 ตั้งค่า Transporter
// คุณควรใช้ environment variables สำหรับ user และ pass เพื่อความปลอดภัย
const transporter = nodemailer.createTransport({
    service: 'gmail', // ตัวอย่าง: ใช้ Gmail
    auth: {
        user: process.env.EMAIL_USER, // อีเมลของคุณ
        pass: process.env.EMAIL_PASS  // รหัสผ่านแอป (App Password) ของ Gmail
    }
});

/**
 * ส่งอีเมลแจ้งเตือนการจองสำเร็จ
 * @param {string} recipientEmail อีเมลผู้รับ (ผู้จอง)
 * @param {object} bookingDetails รายละเอียดการจอง
 */
const sendBookingConfirmationEmail = async (recipientEmail, bookingDetails) => {
    
    // 💡 ฟังก์ชันช่วยจัดรูปแบบวันที่
    const formatTime = (timeString) => {
        const date = new Date(timeString);
        return date.toLocaleString('th-TH', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
        });
    };

    const mailOptions = {
        from: `Meeting Booking System <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `✅ ยืนยันการจองห้องประชุม: ${bookingDetails.room_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #007bff;">การจองห้องประชุมสำเร็จ!</h2>
                
                <p>เรียน คุณ ${bookingDetails.user_name || 'ผู้จอง'},</p>
                
                <p>การจองห้องประชุมของคุณได้รับการบันทึกในระบบเรียบร้อยแล้ว รายละเอียดมีดังนี้:</p>
                
                <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0; border: 1px solid #ddd;">
                    <tr><td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fa; width: 30%;"><strong>ห้องประชุม</strong></td><td style="padding: 10px; border: 1px solid #eee;">${bookingDetails.room_name}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fa;"><strong>ผู้จอง</strong></td><td style="padding: 10px; border: 1px solid #eee;">${bookingDetails.user_name}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fa;"><strong>เริ่ม</strong></td><td style="padding: 10px; border: 1px solid #eee;">${formatTime(bookingDetails.start_time)}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fa;"><strong>สิ้นสุด</strong></td><td style="padding: 10px; border: 1px solid #eee;">${formatTime(bookingDetails.end_time)}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fa;"><strong>สถานะ</strong></td><td style="padding: 10px; border: 1px solid #eee;"><span style="color: #28a745; font-weight: bold;">${bookingDetails.status || 'PENDING'}</span></td></tr>
                </table>
                
                <p>ขอบคุณที่ใช้บริการระบบจองห้องประชุม</p>
                <p style="font-size: 0.9em; color: #6c757d;">ระบบแจ้งเตือนอัตโนมัติ</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // สามารถโยน Error เพื่อให้ Controller ทราบว่าการส่งเมลล้มเหลว
        throw new Error('Failed to send confirmation email');
    }
};

module.exports = {
    sendBookingConfirmationEmail,
};