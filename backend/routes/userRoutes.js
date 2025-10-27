const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/userController'); 


const userController = require('../controllers/userController'); 

const { verifyToken, checkAdminRole } = require('../middlewares/authMiddleware'); 
const roomController = require('../controllers/roomController');

router.post('/register', register);
router.post('/login', login);

router.get('/me', verifyToken, me); 

router.post('/rooms', verifyToken, checkAdminRole, roomController.createRoom);

module.exports = router;