import express from 'express';
import {
  submitAvailability,
  getUserAvailabilities,
  getAllAvailabilities,
  updateAvailabilityStatus,
  deleteAvailability
} from '../controllers/availabilityController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(authenticate);

router.post('/', submitAvailability);
router.get('/my', getUserAvailabilities);
router.get('/all', authorize('admin'), getAllAvailabilities);
router.patch('/:id/status', authorize('admin'), updateAvailabilityStatus);
router.delete('/:id', deleteAvailability);

export default router;
