import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  role: 'admin' | 'user';
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface IShift {
  day: 'monday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  location: string;
  startTime: string;
  endTime: string;
}

export interface IAvailability extends Document {
  user: string;
  shift: IShift;
  date: Date;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchedule extends Document {
  shift: IShift;
  date: Date;
  assignedUsers: {
    user: string;
    gender: 'male' | 'female';
  }[];
  isConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  user: string;
  message: string;
  type: 'availability' | 'confirmation' | 'schedule' | 'general';
  isRead: boolean;
  createdAt: Date;
}

export const SHIFTS: IShift[] = [
  {
    day: 'monday',
    location: 'Careggi',
    startTime: '09:30',
    endTime: '11:30'
  },
  {
    day: 'thursday',
    location: 'Piazza Dalmazia',
    startTime: '10:00',
    endTime: '12:00'
  },
  {
    day: 'friday',
    location: 'Social Hub Belfiore',
    startTime: '15:30',
    endTime: '17:30'
  },
  {
    day: 'saturday',
    location: 'Piazza Dalmazia',
    startTime: '09:00',
    endTime: '11:00'
  },
  {
    day: 'saturday',
    location: 'Piazza Dalmazia',
    startTime: '11:00',
    endTime: '13:00'
  },
  {
    day: 'sunday',
    location: 'Piazza SS. Annunziata',
    startTime: '15:30',
    endTime: '17:30'
  }
];
