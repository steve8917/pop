import mongoose, { Schema } from 'mongoose';
import { IAvailability } from '../types';

const availabilitySchema = new Schema<IAvailability>(
  {
    user: {
      type: String,
      ref: 'User',
      required: true
    },
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Index per ottimizzare le query
availabilitySchema.index({ user: 1, date: 1 });
availabilitySchema.index({ status: 1 });

export default mongoose.model<IAvailability>('Availability', availabilitySchema);
