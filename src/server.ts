import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { verifyToken } from './utils/jwt';
import authRoutes from './routes/authRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoomRoutes from './routes/chatRoom';
import experienceRoutes from './routes/experienceRoutes';
import Message from './models/Message';
import User from './models/User';
import ChatRoom from './models/ChatRoom';
import Schedule from './models/Schedule';
import Notification from './models/Notification';

// Carica variabili d'ambiente
dotenv.config();

const app = express();
app.disable('x-powered-by');

// Se siamo dietro un reverse proxy (es. Nginx) in produzione
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppi tentativi, riprova più tardi'
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', loginLimiter);
app.use('/api/auth/reset-password', loginLimiter);
app.use('/api/auth/resend-verification', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat-room', chatRoomRoutes);
app.use('/api/experiences', experienceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// In produzione serviamo anche il client (Vite build) sullo stesso dominio
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));

  // SPA fallback (non intercettare API o socket)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {} as Record<string, string>);
};

io.use((socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    const authToken =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '') ||
      cookies.token;

    if (!authToken) {
      return next(new Error('Autenticazione richiesta'));
    }

    const decoded = verifyToken(authToken);
    socket.data.user = decoded;
    return next();
  } catch (error) {
    return next(new Error('Token non valido'));
  }
});

// Socket.IO per notifiche in tempo reale e chat
const connectedUsers = new Map<string, string>();
const chatUsers = new Set<string>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Autenticazione per notifiche
  socket.on('authenticate', (userId: string) => {
    const authUserId = socket.data.user?.userId;
    if (!authUserId || authUserId !== userId) {
      console.warn('Socket authenticate mismatch');
      return;
    }
    connectedUsers.set(authUserId, socket.id);
    console.log(`User ${authUserId} authenticated with socket ${socket.id}`);
  });

  // Join chat
  socket.on('join-chat', async (userId: string) => {
    const authUserId = socket.data.user?.userId;
    if (!authUserId || authUserId !== userId) {
      console.warn('Socket join-chat unauthorized');
      return;
    }
    chatUsers.add(socket.id);
    connectedUsers.set(authUserId, socket.id);

    // Invia conteggio utenti online
    io.emit('online-users', chatUsers.size);

    // Invia storico messaggi (ultimi 50)
    try {
      const messages = await Message.find()
        .populate('user', 'firstName lastName gender')
        .sort({ timestamp: -1 })
        .limit(50);

      socket.emit('chat-history', messages.reverse());
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
    }
  });

  // Invia messaggio chat globale
  socket.on('send-message', async (data: { message: string; userId: string; userInfo: any }) => {
    try {
      const authUserId = socket.data.user?.userId;
      if (!authUserId || authUserId !== data.userId) {
        console.warn('Socket send-message unauthorized');
        return;
      }
      const newMessage = await Message.create({
        user: authUserId,
        message: data.message
      });

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('user', 'firstName lastName gender');

      // Invia a tutti gli utenti connessi
      io.emit('chat-message', populatedMessage);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
    }
  });

  // JOIN TURNO CHAT ROOM
  socket.on('join-schedule-chat', async (data: { scheduleId: string; userId: string }) => {
    try {
      const authUserId = socket.data.user?.userId;
      if (!authUserId || authUserId !== data.userId) {
        console.warn('Socket join-schedule-chat unauthorized');
        return;
      }
      const roomId = `schedule-${data.scheduleId}`;
      socket.join(roomId);
      console.log(`User ${authUserId} joined room ${roomId}`);

      // Carica o crea la chat room
      let chatRoom = await ChatRoom.findOne({ schedule: data.scheduleId })
        .populate('messages.user', 'firstName lastName gender');

      if (!chatRoom) {
        // Crea la chat room se non esiste
        const schedule = await Schedule.findById(data.scheduleId);
        if (schedule) {
          const participants = schedule.assignedUsers.map((au: any) => au.user);
          chatRoom = await ChatRoom.create({
            schedule: data.scheduleId,
            participants,
            messages: []
          });
          console.log(`Created new chat room for schedule ${data.scheduleId}`);
        }
      }

      if (chatRoom) {
        socket.emit('schedule-chat-history', chatRoom.messages);
      }

      // Notifica partecipanti che qualcuno è entrato
      socket.to(roomId).emit('user-joined-schedule-chat', {
        userId: authUserId
      });
    } catch (error) {
      console.error('Errore join schedule chat:', error);
    }
  });

  // LEAVE TURNO CHAT ROOM
  socket.on('leave-schedule-chat', (data: { scheduleId: string; userId: string }) => {
    const authUserId = socket.data.user?.userId;
    if (!authUserId || authUserId !== data.userId) {
      console.warn('Socket leave-schedule-chat unauthorized');
      return;
    }
    const roomId = `schedule-${data.scheduleId}`;
    socket.leave(roomId);
    console.log(`User ${authUserId} left room ${roomId}`);

    // Notifica partecipanti che qualcuno è uscito
    socket.to(roomId).emit('user-left-schedule-chat', {
      userId: authUserId
    });
  });

  // INVIA MESSAGGIO TURNO CHAT ROOM
  socket.on('send-schedule-message', async (data: {
    scheduleId: string;
    message: string;
    userId: string;
    userInfo: any;
  }) => {
    try {
      const authUserId = socket.data.user?.userId;
      if (!authUserId || authUserId !== data.userId) {
        console.warn('Socket send-schedule-message unauthorized');
        return;
      }
      const roomId = `schedule-${data.scheduleId}`;

      // Carica o crea la chat room
      let chatRoom = await ChatRoom.findOne({ schedule: data.scheduleId });

      if (!chatRoom) {
        // Crea la chat room se non esiste
        const schedule = await Schedule.findById(data.scheduleId);
        if (schedule) {
          const participants = schedule.assignedUsers.map((au: any) => au.user);
          chatRoom = await ChatRoom.create({
            schedule: data.scheduleId,
            participants,
            messages: []
          });
          console.log(`Created new chat room for schedule ${data.scheduleId}`);
        }
      }

      if (chatRoom) {
        chatRoom.messages.push({
          user: authUserId as any,
          message: data.message,
          timestamp: new Date()
        });

        await chatRoom.save();

        // Popola l'ultimo messaggio
        const updatedChatRoom = await ChatRoom.findById(chatRoom._id)
          .populate('messages.user', 'firstName lastName gender');

        const lastMessage = updatedChatRoom?.messages[updatedChatRoom.messages.length - 1];

        console.log('Sending message to room:', roomId, lastMessage);

        // Invia a tutti nella room
        io.to(roomId).emit('schedule-chat-message', lastMessage);

        // Recupera info turno per il testo notifica
        const scheduleInfo = await Schedule.findById(data.scheduleId).select('date shift');
        const scheduleLabel = scheduleInfo
          ? `${scheduleInfo.date.toLocaleDateString('it-IT')} (${scheduleInfo.shift.location})`
          : 'il tuo turno';
        const notificationMessage = `Nuovo messaggio nella chat del turno del ${scheduleLabel}`;

        // Invia notifica a tutti i partecipanti del turno (anche quelli non nella chat room in questo momento)
        if (chatRoom.participants && chatRoom.participants.length > 0) {
          console.log('📢 Sending notifications to participants:', chatRoom.participants.length);
          for (const participantId of chatRoom.participants) {
            const participantIdStr = participantId.toString();
            console.log(`Checking participant: ${participantIdStr}, sender: ${authUserId}`);
            // Invia notifica solo se non è il mittente
            if (participantIdStr !== authUserId) {
              try {
                const created = await Notification.create({
                  user: participantIdStr,
                  message: notificationMessage,
                  type: 'chat',
                  scheduleId: data.scheduleId
                });
                sendRealtimeNotification(participantIdStr, created);
              } catch (notifyError) {
                console.error('Errore creazione notifica chat:', notifyError);
              }

              const socketId = connectedUsers.get(participantIdStr);
              console.log(`Participant ${participantIdStr} socket: ${socketId}`);
              if (socketId) {
                console.log(`✅ Sending notification to ${participantIdStr} via socket ${socketId}`);
                io.to(socketId).emit('schedule-message-notification', {
                  scheduleId: data.scheduleId,
                  senderId: authUserId
                });
              } else {
                console.log(`⚠️ Participant ${participantIdStr} not connected`);
              }
            } else {
              console.log(`⏭️ Skipping sender ${participantIdStr}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Errore invio messaggio schedule:', error);
    }
  });

  socket.on('disconnect', () => {
    chatUsers.delete(socket.id);
    io.emit('online-users', chatUsers.size);

    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Funzione per inviare notifiche in tempo reale
export const sendRealtimeNotification = (userId: string, notification: any) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
};

// Connessione al database e avvio server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
