const Booking = require('./models/Booking');
const Room = require('./models/Room');

// กำหนดความถี่ในการเช็ค (ทุก 1 นาที)
const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * ฟังก์ชันอัปเดตสถานะ Booking
 * - ถ้า start_time <= now < end_time และ status = pending => เปลี่ยนเป็น confirmed
 * - ถ้า end_time < now => เปลี่ยนเป็น completed
 */
async function updateBookingStatuses() {
    try {
        const now = new Date();

        // 1. อัปเดต booking ที่เริ่มใช้งานแล้ว
        const [activeRows] = await Booking.getAllBookings(); // ดึง booking ทั้งหมด
        for (const booking of activeRows) {
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);

            if ((booking.status === 'pending' || booking.status === 'confirmed') && start <= now && now <= end) {
                await Booking.updateBookingStatus(booking.id, 'confirmed');
            } else if ((booking.status === 'pending' || booking.status === 'confirmed') && end < now) {
                await Booking.updateBookingStatus(booking.id, 'completed');
            }
        }

        console.log(`[Scheduler] Booking statuses updated at ${now}`);
    } catch (err) {
        console.error('Error updating booking statuses:', err);
    }
}

/**
 * ฟังก์ชันอัปเดตสถานะ Room
 * - หากไม่มี booking ทับห้อง => available
 * - หากมี booking ทับห้อง => booked
 */
async function updateRoomStatuses() {
    try {
        const now = new Date();
        const [rooms] = await Room.getAllRooms();

        for (const room of rooms) {
            const bookings = await Booking.getExistingBookingsByRoomAndDate(room.id, now.toISOString().split('T')[0]);
            const hasActiveBooking = bookings.some(b => b.status === 'pending' || b.status === 'confirmed');
            const newStatus = hasActiveBooking ? 'booked' : 'available';
            await Room.updateRoomStatus(room.id, newStatus);
        }

        console.log(`[Scheduler] Room statuses updated at ${now}`);
    } catch (err) {
        console.error('Error updating room statuses:', err);
    }
}

/**
 * ฟังก์ชันเริ่ม Scheduler
 */
function startScheduler() {
    // รันทันทีครั้งแรก
    updateBookingStatuses();
    updateRoomStatuses();

    // รันซ้ำทุก CHECK_INTERVAL_MS
    setInterval(() => {
        updateBookingStatuses();
        updateRoomStatuses();
    }, CHECK_INTERVAL_MS);
}

module.exports = { startScheduler };
