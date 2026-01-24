import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getAllUsers,
  deleteUser
} from '../controllers/authController';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', optionalAuthenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

export default router;
