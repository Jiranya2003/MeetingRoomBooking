const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';

const pool = mysql.createPool({
 host: dbHost,
 user: process.env.DB_USER || 'root',
 password: process.env.DB_PASSWORD || '',
 database: process.env.DB_NAME || 'meeting_room_booking_db',
 waitForConnections: true,
 connectionLimit: 10,
 queueLimit: 0,
});

(async () => {
    try {
        await pool.getConnection();
        console.log(`✅ MySQL Pool connected successfully to ${process.env.DB_NAME} at ${dbHost}!`);
    } catch (error) {
        console.error(`❌ Fatal Error: Could not connect to MySQL database pool at ${dbHost}.`, error.message);
        console.error("💡 Check 1: MySQL server service is running.");
        console.error("💡 Check 2: DB_USER/DB_PASSWORD in .env are correct and exist in MySQL.");
    }
})();

module.exports = pool;
