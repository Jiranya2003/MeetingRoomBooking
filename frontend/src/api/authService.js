import api from './axiosInstance';

const TOKEN_KEY = 'mr_token';

// --- Token Management ---

export function saveToken(token) { 
    if (typeof window !== 'undefined') { // ป้องกัน Error หากรันบน Server (Server-Side Rendering)
        localStorage.setItem(TOKEN_KEY, token); 
    }
}

export function getToken() { 
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY); 
    }
    return null;
}

export function clearToken() { 
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY); 
    }
}

export function logout() { 
    clearToken(); 
    if (typeof window !== 'undefined') {
        window.location.href = '/login'; 
    }
}

// ✨ ปรับปรุง: ใช้ฟังก์ชันมาตรฐานของ JavaScript สำหรับ Base64 Decoding (JWT Payload)
export function getDecodedToken(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        // แปลง Base64Url ให้เป็น Base64 ปกติ (แทนที่ - ด้วย + และ _ ด้วย /)
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // ใช้ atob (เป็น Global function ใน environment ที่มี Window)
        const jsonPayload = decodeURIComponent(
            // ใช้ Buffer.from().toString() ใน Node.js หรือ atob ใน Browser
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding token:", e);
        clearToken(); 
        return null;
    }
}

// --- API Calls ---

export async function login(email, password) {
    // การส่งข้อมูลเป็น Object { email, password } ถูกต้องแล้ว
    const res = await api.post('/users/login', { email, password });
    saveToken(res.data.token);
    return res.data;
}

export async function register(data) {
    // ฟังก์ชันนี้รับ Object { name, email, password } มาอย่างถูกต้อง
    const res = await api.post('/users/register', data);
    return res.data;
}

export async function fetchMe() {
    // ดึงข้อมูลผู้ใช้ปัจจุบัน (Token ต้องถูกแนบไปกับ Axios/API Instance)
    return api.get('/users/me');
}