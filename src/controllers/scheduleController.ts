import { Response } from 'express';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shift, date, assignedUsers } = req.body;

    // Verifica regole: 1 maschio min, 1-2 femmine
    const males = assignedUsers.filter((u: any) => u.gender === 'male').length;
    const females = assignedUsers.filter((u: any) => u.gender === 'female').length;

    if (males < 1) {
      res.status(400).json({ message: 'Almeno un fratello deve essere assegnato al turno' });
      return;
    }

    if (females < 1 || females > 2) {
      res.status(400).json({ message: 'Devono essere assegnate minimo 1 e massimo 2 sorelle' });
      return;
    }

    const schedule = await Schedule.create({
      shift,
      date: new Date(date),
      assignedUsers,
      isConfirmed: true
    });

    // Invia notifiche agli utenti assegnati
    for (const assignment of assignedUsers) {
      await Notification.create({
        user: assignment.user,
        message: `Sei stato assegnato al turno del ${new Date(date).toLocaleDateString('it-IT')} presso ${shift.location}`,
        type: 'schedule'
      });
    }

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('assignedUsers.user', 'firstName lastName email gender');

    res.status(201).json({
      success: true,
      message: 'Programma creato con successo',
      schedule: populatedSchedule
    });
  } catch (error: any) {
    console.error('Errore creazione programma:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ message: 'Mese e anno sono richiesti' });
      return;
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

    console.log('Fetching schedules for date range:', startDate, 'to', endDate);

    // Mostra tutti gli schedule (confermati e non confermati)
    const schedules = await Schedule.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('assignedUsers.user', '_id firstName lastName gender')
      .sort({ date: 1, 'shift.startTime': 1 });

    console.log('Found schedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('First schedule assignedUsers:', JSON.stringify(schedules[0].assignedUsers, null, 2));
    }

    res.json({
      success: true,
      schedules
    });
  } catch (error: any) {
    console.error('Errore recupero programma:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedUsers } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      res.status(404).json({ message: 'Programma non trovato' });
      return;
    }

    // Verifica regole
    const males = assignedUsers.filter((u: any) => u.gender === 'male').length;
    const females = assignedUsers.filter((u: any) => u.gender === 'female').length;

    if (males < 1) {
      res.status(400).json({ message: 'Almeno un fratello deve essere assegnato al turno' });
      return;
    }

    if (females < 1 || females > 2) {
      res.status(400).json({ message: 'Devono essere assegnate minimo 1 e massimo 2 sorelle' });
      return;
    }

    schedule.assignedUsers = assignedUsers;
    await schedule.save();

    // Invia notifiche agli utenti aggiornati
    for (const assignment of assignedUsers) {
      await Notification.create({
        user: assignment.user,
        message: `Il programma per il turno del ${schedule.date.toLocaleDateString('it-IT')} è stato aggiornato`,
        type: 'schedule'
      });
    }

    const updatedSchedule = await Schedule.findById(id)
      .populate('assignedUsers.user', 'firstName lastName gender');

    res.json({
      success: true,
      message: 'Programma aggiornato con successo',
      schedule: updatedSchedule
    });
  } catch (error: any) {
    console.error('Errore aggiornamento programma:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      res.status(404).json({ message: 'Programma non trovato' });
      return;
    }

    res.json({
      success: true,
      message: 'Programma eliminato con successo'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { month, year } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    let query: any = {
      'assignedUsers.user': userId,
      isConfirmed: true
    };

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const schedules = await Schedule.find(query)
      .populate('assignedUsers.user', 'firstName lastName gender')
      .sort({ date: 1 });

    res.json({
      success: true,
      schedules
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
