import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import ChatRoom from '../models/ChatRoom';
import Availability from '../models/Availability';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';
import { generateToken, generatePasswordResetToken } from '../utils/jwt';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../utils/email';
import logger from '../utils/logger';

const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '600000'); // 10 minuti

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, gender } = req.body;

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email già registrata' });
      return;
    }

    // Genera token di verifica email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Crea nuovo utente
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      gender,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Invia email di verifica
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(email, firstName, verificationUrl);
    } catch (emailError) {
      logger.error('Errore invio email verifica:', emailError);
      // Non bloccare la registrazione se l'email fallisce
    }

    res.status(201).json({
      success: true,
      message: 'Registrazione completata! Controlla la tua email per verificare il tuo account.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error: any) {
    logger.error('Errore registrazione:', error);
    res.status(500).json({ message: error.message || 'Errore durante la registrazione' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Trova utente con password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Credenziali non valide' });
      return;
    }

    // Verifica se l'email è stata verificata
    if (!user.emailVerified) {
      res.status(403).json({
        message: 'La tua email non è stata verificata. Controlla la tua casella di posta, inclusa la cartella spam, per il link di verifica.',
        error: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    // Verifica se l'account è bloccato
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        message: `Il tuo account è bloccato per troppi tentativi di login falliti. Riprova tra ${remainingTime} minuti.`,
        error: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
      return;
    }

    // Verifica password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();

      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      const remainingAttempts = maxAttempts - (user.loginAttempts + 1);

      if (remainingAttempts <= 0) {
        res.status(423).json({
          message: 'Troppi tentativi falliti. Account bloccato per 2 ore',
          lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
        });
        return;
      }

      res.status(401).json({
        message: 'Credenziali non valide',
        remainingAttempts
      });
      return;
    }

    // Reset tentativi di login
    await user.resetLoginAttempts();

    // Genera token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TIMEOUT,
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        role: user.role
      },
      token
    });
  } catch (error: any) {
    logger.error('Errore login:', error);
    res.status(500).json({ message: error.message || 'Errore durante il login' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      // Cancella i messaggi dalle chat room dove l'utente è partecipante
      const chatRooms = await ChatRoom.find({ participants: userId });

      for (const chatRoom of chatRooms) {
        // Rimuovi i messaggi dell'utente
        chatRoom.messages = chatRoom.messages.filter(
          (msg: any) => msg.user.toString() !== userId
        );
        await chatRoom.save();
      }
    }

    res.clearCookie('token');
    res.json({ success: true, message: 'Logout effettuato con successo' });
  } catch (error: any) {
    logger.error('Errore durante logout:', error);
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout effettuato con successo' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ message: 'Utente non trovato' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Non rivelare se l'email esiste o meno per sicurezza
      res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset'
      });
      return;
    }

    const resetToken = generatePasswordResetToken(user._id.toString());
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Email di reset password inviata'
    });
  } catch (error: any) {
    logger.error('Errore forgot password:', error);
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400).json({ message: 'Token non valido o scaduto' });
      return;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reimpostata con successo'
    });
  } catch (error: any) {
    logger.error('Errore reset password:', error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Token di verifica non valido o scaduto'
      });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Invia email di benvenuto dopo la verifica
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      logger.error('Errore invio email benvenuto:', emailError);
    }

    res.json({
      success: true,
      message: 'Email verificata con successo! Ora puoi effettuare il login.'
    });
  } catch (error: any) {
    logger.error('Errore verifica email:', error);
    res.status(500).json({ message: error.message });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email richiesta' });
      return;
    }

    // Trova utente
    const user = await User.findOne({ email });
    if (!user) {
      // Non rivelare se l'email esiste o meno per sicurezza
      res.json({
        success: true,
        message: 'Se l\'email esiste e non è verificata, riceverai un nuovo link di verifica'
      });
      return;
    }

    // Verifica se l'email è già verificata
    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email già verificata. Puoi effettuare il login.'
      });
      return;
    }

    // Genera nuovo token di verifica
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Invia email di verifica
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(email, user.firstName, verificationUrl);
    } catch (emailError) {
      logger.error('Errore invio email verifica:', emailError);
      res.status(500).json({ message: 'Errore durante l\'invio dell\'email' });
      return;
    }

    res.json({
      success: true,
      message: 'Email di verifica inviata! Controlla la tua casella di posta.'
    });
  } catch (error: any) {
    logger.error('Errore reinvio email verifica:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('firstName lastName email gender role isActive emailVerified createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'ID utente richiesto' });
      return;
    }

    if (req.user?.userId === id) {
      res.status(400).json({ message: 'Non puoi eliminare il tuo account' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Utente non trovato' });
      return;
    }

    // Rimuovi disponibilità dell'utente
    await Availability.deleteMany({ user: user._id });

    // Rimuovi notifiche dell'utente
    await Notification.deleteMany({ user: user._id });

    // Rimuovi l'utente dai turni assegnati
    const schedules = await Schedule.find({ 'assignedUsers.user': user._id });
    for (const schedule of schedules) {
      schedule.assignedUsers = schedule.assignedUsers.filter(
        (assignment: any) => assignment.user.toString() !== user._id.toString()
      );

      if (schedule.assignedUsers.length === 0) {
        await Schedule.findByIdAndDelete(schedule._id);
      } else {
        const males = schedule.assignedUsers.filter((u: any) => u.gender === 'male').length;
        const females = schedule.assignedUsers.filter((u: any) => u.gender === 'female').length;
        schedule.isConfirmed = males >= 1 && females >= 1 && females <= 2;
        await schedule.save();
      }
    }

    // Rimuovi l'utente dalle chat room e i suoi messaggi
    const chatRooms = await ChatRoom.find({ participants: user._id });
    for (const chatRoom of chatRooms) {
      chatRoom.participants = chatRoom.participants.filter(
        (participant) => participant.toString() !== user._id.toString()
      );
      chatRoom.messages = chatRoom.messages.filter(
        (msg: any) => msg.user.toString() !== user._id.toString()
      );
      await chatRoom.save();
    }

    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Utente eliminato con successo'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
