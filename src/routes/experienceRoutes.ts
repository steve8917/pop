import express from 'express';
import { authenticate } from '../middleware/auth';
import { createExperience, deleteExperience, listExperiences } from '../controllers/experienceController';

const router = express.Router();

router.get('/', authenticate, listExperiences);
router.post('/', authenticate, createExperience);
router.delete('/:id', authenticate, deleteExperience);

export default router;
