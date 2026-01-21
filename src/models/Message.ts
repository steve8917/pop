import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  user: string;
  message: string;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index per ottimizzare le query
messageSchema.index({ timestamp: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
