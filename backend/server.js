const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron'); // ✅ เพิ่ม node-cron

dotenv.config();

const app = express();
require('./config/db'); 

// -----------------------------------------------------------------
// CORS
// -----------------------------------------------------------------
const corsOptions = {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(corsOptions)); 
app.use(express.json());

// -----------------------------------------------------------------
// Routes
// -----------------------------------------------------------------
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const meetingRoomRoutes = require('./routes/meetingRoomRoutes'); 

app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/meetingrooms', meetingRoomRoutes); 

// -----------------------------------------------------------------
// Cron Job: อัปเดตสถานะการจองทุก 1 ชั่วโมง
// -----------------------------------------------------------------
const { updateBookingStatusAuto } = require('./models/Booking');

cron.schedule('0 * * * *', async () => { // รันทุกชั่วโมง
    try {
        console.log('⏰ Running scheduled booking status update:', new Date());
        await updateBookingStatusAuto();
        console.log('✅ Booking statuses updated successfully');
    } catch (err) {
        console.error('❌ Error updating booking statuses:', err);
    }
});

// -----------------------------------------------------------------
// Test route
// -----------------------------------------------------------------
app.get('/', (req, res) => {
    res.send('Meeting Room Booking API is running');
});

// -----------------------------------------------------------------
// Start server
// -----------------------------------------------------------------
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});

cron.schedule('*/10 * * * *', async () => { // รันทุก 10 นาที
    try {
        console.log('⏰ Running scheduled booking status update:', new Date());
        await updateBookingStatusAuto();
        console.log('✅ Booking statuses updated successfully');
    } catch (err) {
        console.error('❌ Error updating booking statuses:', err);
    }
});
