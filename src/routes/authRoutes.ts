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
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation
} from '../middleware/validation';
import { handleValidationErrors } from '../middleware/validationHandler';

const router = express.Router();

router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/logout', optionalAuthenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationValidation, handleValidationErrors, resendVerificationEmail);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

export default router;
