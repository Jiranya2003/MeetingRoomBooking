const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkAdminRole } = require('../middlewares/authMiddleware');

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);
router.post('/', verifyToken, checkAdminRole, roomController.createRoom);
router.put('/:id', verifyToken, checkAdminRole, roomController.updateRoom);
router.delete('/:id', verifyToken, checkAdminRole, roomController.deleteRoom);

module.exports = router;