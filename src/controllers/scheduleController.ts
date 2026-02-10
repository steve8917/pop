import { Response } from 'express';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';

const normalizeDateOnly = (input: unknown): Date => {
  if (typeof input === 'string') {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
    }
  }

  const date = new Date(input as any);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0));
};

const getUtcMonthRange = (month: number, year: number): { start: Date; end: Date } => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

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

    const normalizedDate = normalizeDateOnly(date);

    const schedule = await Schedule.create({
      shift,
      date: normalizedDate,
      assignedUsers,
      isConfirmed: true
    });

    // Invia notifiche agli utenti assegnati
    for (const assignment of assignedUsers) {
      await Notification.create({
        user: assignment.user,
        message: `Sei stato assegnato al turno del ${normalizedDate.toLocaleDateString('it-IT')} presso ${shift.location}`,
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

    const m = parseInt(month as string);
    const y = parseInt(year as string);
    const { start: startDate, end: endDate } = getUtcMonthRange(m, y);

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
      'assignedUsers.user': userId
      // Rimosso il filtro isConfirmed per mostrare tutti i turni anche con una sola persona
    };

    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const { start, end } = getUtcMonthRange(m, y);
      query.date = { $gte: start, $lte: end };
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

export const getScheduleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const schedule = await Schedule.findById(id)
      .populate('assignedUsers.user', '_id firstName lastName gender');

    if (!schedule) {
      res.status(404).json({ message: 'Turno non trovato' });
      return;
    }

    if (role !== 'admin') {
      const isAssigned = schedule.assignedUsers.some((assignment: any) => {
        const assignedId = typeof assignment.user === 'string'
          ? assignment.user
          : assignment.user?._id?.toString();
        return assignedId === userId;
      });

      if (!isAssigned) {
        res.status(403).json({ message: 'Non sei assegnato a questo turno' });
        return;
      }
    }

    res.json({
      success: true,
      schedule
    });
  } catch (error: any) {
    console.error('Errore recupero turno:', error);
    res.status(500).json({ message: error.message });
  }
};
