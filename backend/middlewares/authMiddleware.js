const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const verifyToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; 
    
    try {
      
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
     
        req.user = decoded; 
        
        next(); 
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};


const checkAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); 
    } else {
        res.status(403).json({ message: 'Access denied. Requires Admin role.' });
    }
};

const checkUserRole = (req, res, next) => {
    if (req.user && (req.user.role === 'user' || req.user.role === 'employee')) {
        next();
    } else {
        
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Requires User/Employee role.' });
        }
    }
};


module.exports = { 
    verifyToken, 
    checkAdminRole, 
    checkUserRole 
};