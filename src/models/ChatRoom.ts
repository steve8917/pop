import mongoose, { Schema, Document } from 'mongoose';

interface IChatMessage {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface IChatRoom extends Document {
  schedule: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  messages: IChatMessage[];
  lastReadMessage: Map<string, mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatRoomSchema = new Schema({
  schedule: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
    unique: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [ChatMessageSchema],
  lastReadMessage: {
    type: Map,
    of: Schema.Types.ObjectId,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
