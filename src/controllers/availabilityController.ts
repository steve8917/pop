import { Response } from 'express';
import Availability from '../models/Availability';
import User from '../models/User';
import Notification from '../models/Notification';
import Schedule from '../models/Schedule';
import { AuthRequest } from '../types';
import { io, sendRealtimeNotification } from '../server';

export const submitAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { availabilities } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    // Crea le disponibilità
    const createdAvailabilities = await Availability.insertMany(
      availabilities.map((av: any) => ({
        user: userId,
        shift: av.shift,
        date: new Date(av.date),
        status: 'pending'
      }))
    );

    // Crea notifica per l'utente
    await Notification.create({
      user: userId,
      message: 'Le tue disponibilità sono state inviate e sono in attesa di conferma',
      type: 'availability'
    });

    // Notifica admin se arriva una disponibilità "istantanea" (a brevissimo termine)
    // Nota: non esiste un flag esplicito nel DB, quindi usiamo una regola temporale.
    try {
      const nowMs = Date.now();
      const instantWindowMs = 48 * 60 * 60 * 1000; // 48 ore
      const gracePastMs = 24 * 60 * 60 * 1000; // tolleranza per timezone/UTC (fino a 24h nel passato)

      const instantAvailabilities = createdAvailabilities.filter((a: any) => {
        const d = a?.date instanceof Date ? a.date.getTime() : new Date(a?.date).getTime();
        return d >= nowMs - gracePastMs && d <= nowMs + instantWindowMs;
      });

      if (instantAvailabilities.length > 0) {
        const submitter = await User.findById(userId).select('firstName lastName');
        const submitterName = submitter
          ? `${submitter.firstName} ${submitter.lastName}`
          : 'un utente';

        const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
        if (admins.length > 0) {
          const first = instantAvailabilities[0];
          const when = first?.date ? new Date(first.date).toLocaleDateString('it-IT') : '';
          const where = first?.shift?.location ? ` (${first.shift.location})` : '';
          const countSuffix = instantAvailabilities.length > 1 ? ` (+${instantAvailabilities.length - 1})` : '';

          const message = `Disponibilità istantanea inserita da ${submitterName} per ${when}${where}${countSuffix}`;

          for (const admin of admins) {
            const adminId = admin._id.toString();
            const created = await Notification.create({
              user: adminId,
              message,
              type: 'availability'
            });
            sendRealtimeNotification(adminId, created);
          }
        }
      }
    } catch (notifyErr) {
      console.error('Errore notifica admin disponibilità istantanea:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: 'Disponibilità inviate con successo',
      availabilities: createdAvailabilities
    });
  } catch (error: any) {
    console.error('Errore submit disponibilità:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserAvailabilities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { month, year } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    let query: any = { user: userId };

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const availabilities = await Availability.find(query).sort({ date: 1 });

    res.json({
      success: true,
      availabilities
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAvailabilities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, status } = req.query;

    let query: any = {};

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const availabilities = await Availability.find(query)
      .populate('user', 'firstName lastName email gender')
      .sort({ date: 1, 'shift.day': 1 });

    res.json({
      success: true,
      availabilities
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAvailabilityStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const availability = await Availability.findById(id).populate('user');
    if (!availability) {
      res.status(404).json({ message: 'Disponibilità non trovata' });
      return;
    }

    availability.status = status;
    await availability.save();

    // Invia notifica all'utente
    await Notification.create({
      user: availability.user,
      message: `La tua disponibilità per ${availability.shift.location} è stata ${
        status === 'confirmed' ? 'confermata' : 'rifiutata'
      }`,
      type: 'confirmation'
    });

    // Crea/aggiorna il programma quando viene confermata una disponibilità
    if (status === 'confirmed') {
      // Crea o aggiorna automaticamente il programma
      await autoCreateSchedule(availability);
      // Notifica tutti i client di aggiornare i programmi
      console.log('Emitting schedule-updated to all clients');
      io.emit('schedule-updated');
    }

    res.json({
      success: true,
      message: 'Stato disponibilità aggiornato',
      availability
    });
  } catch (error: any) {
    console.error('Errore aggiornamento disponibilità:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const availability = await Availability.findById(id);
    if (!availability) {
      res.status(404).json({ message: 'Disponibilità non trovata' });
      return;
    }

    // Verifica che l'utente possa eliminare solo le proprie disponibilità
    if (availability.user.toString() !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Non autorizzato' });
      return;
    }

    await Availability.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Disponibilità eliminata'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Funzione helper per creare automaticamente il programma
async function autoCreateSchedule(availability: any): Promise<void> {
  try {
    const user: any = availability.user;
    
    // Controlla se l'utente è stato popolato correttamente
    if (typeof user === 'string' || !user || !user._id) {
      console.error('❌ AutoCreateSchedule - User not populated correctly:', user);
      return;
    }
    
    console.log('🔍 AutoCreateSchedule - User:', user.firstName, user.lastName, 'Gender:', user.gender);
    console.log('🔍 AutoCreateSchedule - Date:', availability.date);
    console.log('🔍 AutoCreateSchedule - Shift:', availability.shift);

    // Cerca se esiste già un programma per questa data e turno
    let schedule = await Schedule.findOne({
      date: availability.date,
      'shift.day': availability.shift.day,
      'shift.location': availability.shift.location,
      'shift.startTime': availability.shift.startTime,
      'shift.endTime': availability.shift.endTime
    });

    console.log('🔍 AutoCreateSchedule - Found existing schedule:', schedule ? 'YES' : 'NO');
    if (schedule) {
      console.log('🔍 AutoCreateSchedule - Current assignedUsers:', schedule.assignedUsers.map((u: any) => u.user.toString()));
    }

    if (schedule) {
      // Programma esiste, aggiungi utente se non già presente
      const userExists = schedule.assignedUsers.some(
        (u: any) => u.user.toString() === user._id.toString()
      );

      console.log('🔍 AutoCreateSchedule - User already exists in schedule:', userExists);

      if (!userExists) {
        schedule.assignedUsers.push({
          user: user._id,
          gender: user.gender
        });

        console.log('✅ AutoCreateSchedule - User added to schedule');

        // Verifica regole (1 fratello, 1-2 sorelle)
        const males = schedule.assignedUsers.filter((u: any) => u.gender === 'male').length;
        const females = schedule.assignedUsers.filter((u: any) => u.gender === 'female').length;

        console.log('🔍 AutoCreateSchedule - Males:', males, 'Females:', females);

        // Conferma se le regole sono rispettate perfettamente
        if (males >= 1 && females >= 1 && females <= 2) {
          schedule.isConfirmed = true;
          console.log('✅ AutoCreateSchedule - Schedule CONFIRMED');
        } else {
          // Mostra comunque nel programma ma non confermato
          schedule.isConfirmed = false;
          console.log('⚠️ AutoCreateSchedule - Schedule NOT confirmed yet');
        }

        await schedule.save();
        console.log('💾 AutoCreateSchedule - Schedule saved successfully');
      } else {
        console.log('⏭️ AutoCreateSchedule - User already in schedule, skipping');
      }
    } else {
      // Crea nuovo programma (sempre visibile nel calendario)
      schedule = await Schedule.create({
        shift: {
          day: availability.shift.day,
          location: availability.shift.location,
          startTime: availability.shift.startTime,
          endTime: availability.shift.endTime
        },
        date: availability.date,
        assignedUsers: [
          {
            user: user._id,
            gender: user.gender
          }
        ],
        isConfirmed: false // Sarà confermato quando rispetterà le regole
      });

      console.log(`Nuovo programma creato per ${availability.shift.location}`);
    }

    // Invia notifica a tutti gli utenti assegnati se il programma è confermato
    if (schedule.isConfirmed) {
      for (const assignment of schedule.assignedUsers) {
        await Notification.create({
          user: assignment.user,
          message: `Il programma per il ${new Date(schedule.date).toLocaleDateString('it-IT')} presso ${schedule.shift.location} è stato confermato!`,
          type: 'schedule'
        });
      }
    }
  } catch (error) {
    console.error('Errore creazione automatica programma:', error);
    // Non bloccare la conferma della disponibilità se il programma fallisce
  }
}
