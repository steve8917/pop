import express from 'express';
import { authenticate } from '../middleware/auth';
import { getChatRoom, sendMessage, getUserSchedules, getUnreadCounts, markAsRead } from '../controllers/chatRoomController';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(authenticate);

// Ottieni turni dell'utente
router.get('/my-schedules', getUserSchedules);

// Ottieni conteggio messaggi non letti
router.get('/unread-counts', getUnreadCounts);

// Ottieni chat room per un turno
router.get('/:scheduleId', getChatRoom);

// Invia messaggio in una chat room
router.post('/:scheduleId/message', sendMessage);

// Segna messaggi come letti
router.post('/:scheduleId/mark-read', markAsRead);

export default router;
