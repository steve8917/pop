import mongoose, { Schema } from 'mongoose';
import { ISchedule } from '../types';

const scheduleSchema = new Schema<ISchedule>(
  {
    shift: {
      day: {
        type: String,
        enum: ['monday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      location: {
        type: String,
        required: true
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      }
    },
    date: {
      type: Date,
      required: true
    },
    assignedUsers: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        gender: {
          type: String,
          enum: ['male', 'female'],
          required: true
        }
      }
    ],
    isConfirmed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index per ottimizzare le query
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ 'shift.day': 1, date: 1 });

// Validazione: almeno 1 maschio e min 1 max 2 femmine
scheduleSchema.pre('save', function (next) {
  const males = this.assignedUsers.filter(u => u.gender === 'male').length;
  const females = this.assignedUsers.filter(u => u.gender === 'female').length;

  if (this.isConfirmed) {
    if (males < 1) {
      return next(new Error('Almeno un fratello deve essere assegnato al turno'));
    }
    if (females < 1 || females > 2) {
      return next(new Error('Devono essere assegnate minimo 1 e massimo 2 sorelle'));
    }
  }

  next();
});

export default mongoose.model<ISchedule>('Schedule', scheduleSchema);
