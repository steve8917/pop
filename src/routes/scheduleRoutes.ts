import express from 'express';
import {
  createSchedule,
  getMonthlySchedule,
  updateSchedule,
  deleteSchedule,
  getUserSchedule,
  getScheduleById
} from '../controllers/scheduleController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(authenticate);

router.post('/', authorize('admin'), createSchedule);
router.get('/monthly', getMonthlySchedule);
router.get('/my', getUserSchedule);
router.get('/:id', getScheduleById);
router.put('/:id', authorize('admin'), updateSchedule);
router.delete('/:id', authorize('admin'), deleteSchedule);

export default router;
