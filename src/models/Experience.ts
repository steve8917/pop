import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

export interface IExperience extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500
    }
  },
  {
    timestamps: true
  }
);

ExperienceSchema.index({ createdAt: -1 });

export default mongoose.model<IExperience>('Experience', ExperienceSchema);
