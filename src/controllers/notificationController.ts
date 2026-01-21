import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';

export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOne({ _id: id, user: userId });
    if (!notification) {
      res.status(404).json({ message: 'Notifica non trovata' });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notifica segnata come letta'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'Tutte le notifiche segnate come lette'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!notification) {
      res.status(404).json({ message: 'Notifica non trovata' });
      return;
    }

    res.json({
      success: true,
      message: 'Notifica eliminata'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
