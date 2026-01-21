import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email è richiesta'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Inserisci un email valida']
    },
    password: {
      type: String,
      required: [true, 'Password è richiesta'],
      minlength: [8, 'La password deve essere almeno 8 caratteri'],
      select: false
    },
    firstName: {
      type: String,
      required: [true, 'Nome è richiesto'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Cognome è richiesto'],
      trim: true
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Genere è richiesto']
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password prima del salvataggio
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metodo per confrontare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Incrementa tentativi di login
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Se il lock è scaduto, resetta i tentativi
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
    return;
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Blocca l'account dopo 5 tentativi (per 2 ore)
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  if (this.loginAttempts + 1 >= maxAttempts && !this.lockUntil) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  await this.updateOne(updates);
};

// Resetta tentativi di login
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

export default mongoose.model<IUser>('User', userSchema);
