import { Response } from 'express';
import ChatRoom from '../models/ChatRoom';
import Schedule from '../models/Schedule';
import { AuthRequest } from '../types';

// Ottieni o crea chat room per un turno
export const getChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    // Verifica che l'utente sia assegnato al turno
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      res.status(404).json({ message: 'Turno non trovato' });
      return;
    }

    const isAssigned = schedule.assignedUsers.some(
      (assignment: any) => assignment.user.toString() === userId
    );

    if (!isAssigned) {
      res.status(403).json({ message: 'Non sei assegnato a questo turno' });
      return;
    }

    // Trova o crea la chat room
    let chatRoom = await ChatRoom.findOne({ schedule: scheduleId })
      .populate('messages.user', 'firstName lastName gender');

    if (!chatRoom) {
      // Crea nuova chat room con tutti i partecipanti del turno
      const participants = schedule.assignedUsers.map((assignment: any) => assignment.user);

      chatRoom = await ChatRoom.create({
        schedule: scheduleId,
        participants,
        messages: []
      });

      chatRoom = await ChatRoom.findById(chatRoom._id)
        .populate('messages.user', 'firstName lastName gender');
    }

    res.json({
      success: true,
      chatRoom
    });
  } catch (error: any) {
    console.error('Errore recupero chat room:', error);
    res.status(500).json({ message: error.message });
  }
};

// Invia messaggio in una chat room
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    // Verifica che l'utente sia assegnato al turno
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      res.status(404).json({ message: 'Turno non trovato' });
      return;
    }

    const isAssigned = schedule.assignedUsers.some(
      (assignment: any) => assignment.user.toString() === userId
    );

    if (!isAssigned) {
      res.status(403).json({ message: 'Non sei assegnato a questo turno' });
      return;
    }

    // Trova o crea chat room
    let chatRoom = await ChatRoom.findOne({ schedule: scheduleId });

    if (!chatRoom) {
      const participants = schedule.assignedUsers.map((assignment: any) => assignment.user);
      chatRoom = await ChatRoom.create({
        schedule: scheduleId,
        participants,
        messages: []
      });
    }

    // Aggiungi messaggio
    chatRoom.messages.push({
      user: userId as any,
      message,
      timestamp: new Date()
    });

    await chatRoom.save();

    // Popola l'ultimo messaggio per la risposta
    const updatedChatRoom = await ChatRoom.findById(chatRoom._id)
      .populate('messages.user', 'firstName lastName gender');

    const lastMessage = updatedChatRoom?.messages[updatedChatRoom.messages.length - 1];

    res.json({
      success: true,
      message: lastMessage
    });
  } catch (error: any) {
    console.error('Errore invio messaggio:', error);
    res.status(500).json({ message: error.message });
  }
};

// Ottieni i turni dell'utente (dove è assegnato)
export const getUserSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    // Trova tutti i turni dove l'utente è assegnato
    const schedules = await Schedule.find({
      'assignedUsers.user': userId
    })
      .populate('assignedUsers.user', 'firstName lastName gender')
      .sort({ date: 1 });

    res.json({
      success: true,
      schedules
    });
  } catch (error: any) {
    console.error('Errore recupero turni utente:', error);
    res.status(500).json({ message: error.message });
  }
};

// Ottieni conteggio messaggi non letti per tutti i turni dell'utente
export const getUnreadCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    // Trova tutti i turni dove l'utente è assegnato
    const schedules = await Schedule.find({
      'assignedUsers.user': userId
    }).select('_id');

    const scheduleIds = schedules.map(s => s._id);

    // Trova tutte le chat rooms per questi turni
    const chatRooms = await ChatRoom.find({
      schedule: { $in: scheduleIds }
    });

    // Calcola messaggi non letti per ogni chat room
    const unreadCounts: { [key: string]: number } = {};

    for (const chatRoom of chatRooms) {
      const scheduleId = chatRoom.schedule.toString();
      const lastReadMessageId = chatRoom.lastReadMessage?.get(userId);

      if (!lastReadMessageId && chatRoom.messages.length > 0) {
        // Nessun messaggio mai letto
        unreadCounts[scheduleId] = chatRoom.messages.length;
      } else if (lastReadMessageId) {
        // Conta messaggi dopo l'ultimo letto
        const lastReadIndex = chatRoom.messages.findIndex(
          (msg: any) => msg._id.toString() === lastReadMessageId.toString()
        );

        if (lastReadIndex !== -1) {
          unreadCounts[scheduleId] = chatRoom.messages.length - lastReadIndex - 1;
        } else {
          unreadCounts[scheduleId] = chatRoom.messages.length;
        }
      } else {
        unreadCounts[scheduleId] = 0;
      }
    }

    res.json({
      success: true,
      unreadCounts
    });
  } catch (error: any) {
    console.error('Errore recupero conteggio non letti:', error);
    res.status(500).json({ message: error.message });
  }
};

// Segna messaggi come letti
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const chatRoom = await ChatRoom.findOne({ schedule: scheduleId });

    if (!chatRoom) {
      res.status(404).json({ message: 'Chat room non trovata' });
      return;
    }

    // Aggiorna l'ultimo messaggio letto
    if (chatRoom.messages.length > 0) {
      const lastMessage = chatRoom.messages[chatRoom.messages.length - 1];
      if (lastMessage._id) {
        chatRoom.lastReadMessage.set(userId, lastMessage._id);
        await chatRoom.save();
      }
    }

    res.json({
      success: true
    });
  } catch (error: any) {
    console.error('Errore aggiornamento messaggi letti:', error);
    res.status(500).json({ message: error.message });
  }
};
