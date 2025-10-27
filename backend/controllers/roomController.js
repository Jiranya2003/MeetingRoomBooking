const Room = require('../models/Room');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.getAllRooms();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Room.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Not found' });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRoom = async (req, res) => {
  try {
    const id = await Room.createRoom(req.body);
    res.status(201).json({ message: 'Room created', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRoom = async (req, res) => {
  try {
    await Room.updateRoom(req.params.id, req.body);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    await Room.deleteRoom(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom };
