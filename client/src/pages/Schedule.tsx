import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, Clock, User, MessageCircle } from 'lucide-react';
import { createAppSocket } from '../utils/socket';

interface ScheduleItem {
  _id: string;
  shift: {
    day: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  date: string;
  assignedUsers: {
    user: {
      _id?: string;
      firstName: string;
      lastName: string;
      gender: string;
    } | string;
    gender: string;
  }[];
  isConfirmed: boolean;
}

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Lunedì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const Schedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchSchedules();
    fetchUnreadCounts();
  }, [selectedMonth, selectedYear]);

  // Polling per aggiornamenti automatici ogni 30 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSchedules();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  // Socket.IO per aggiornamenti in tempo reale delle notifiche
  useEffect(() => {
    if (!user) return;

    const newSocket = createAppSocket();

    newSocket.on('connect', () => {
      console.log('Schedule page socket connected');
      newSocket.emit('authenticate', user.id);
    });

    // Ascolta eventi di nuovi messaggi per aggiornare il badge
    newSocket.on('schedule-message-notification', (data: { scheduleId: string; senderId: string }) => {
      console.log('📬 Received notification:', data);
      console.log('Current user ID:', user.id);
      // Se il messaggio non è stato inviato da me, incrementa il conteggio e mostra toast
      if (data.senderId !== user.id) {
        console.log('✅ Incrementing unread count for schedule:', data.scheduleId);
        setUnreadCounts(prev => {
          const newCount = (prev[data.scheduleId] || 0) + 1;
          console.log('New unread counts:', { ...prev, [data.scheduleId]: newCount });
          return {
            ...prev,
            [data.scheduleId]: newCount
          };
        });
        // Mostra notifica toast
        toast.success('Nuovo messaggio nella chat di un turno');
      } else {
        console.log('⏭️ Skipping notification - message from current user');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching schedules for:', selectedMonth, selectedYear);
      const { data } = await api.get('/schedule/monthly', {
        params: { month: selectedMonth, year: selectedYear }
      });
      console.log('Schedules received:', data.schedules);
      console.log('Number of schedules:', data.schedules?.length);
      setSchedules(data.schedules || []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const { data } = await api.get('/chat-room/unread-counts');
      setUnreadCounts(data.unreadCounts || {});
    } catch (error: any) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const getScheduleWarnings = (schedule: ScheduleItem) => {
    const males = schedule.assignedUsers.filter((u) => u.gender === 'male').length;
    const females = schedule.assignedUsers.filter((u) => u.gender === 'female').length;
    const warnings: string[] = [];

    if (males < 1) {
      warnings.push('Manca almeno un fratello');
    }
    if (females < 1) {
      warnings.push('Manca almeno una sorella');
    }
    if (females > 2) {
      warnings.push('Troppe sorelle (max 2)');
    }

    return warnings;
  };

  const isUserAssigned = (schedule: ScheduleItem) => {
    if (!user) return false;
    console.log('Checking if user is assigned. User ID:', user.id);
    console.log('Schedule assigned users:', schedule.assignedUsers);

    return schedule.assignedUsers.some((assignment) => {
      const assignedUserId = typeof assignment.user === 'string'
        ? assignment.user
        : assignment.user?._id;

      console.log('Comparing:', assignedUserId, 'with', user.id);
      return assignedUserId === user.id;
    });
  };

  const handleOpenChat = (scheduleId: string) => {
    // Azzera il conteggio dei messaggi non letti per questa chat
    setUnreadCounts(prev => ({
      ...prev,
      [scheduleId]: 0
    }));
    navigate(`/schedule/${scheduleId}/chat`);
  };

  return (
    <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">Programma Mensile</h1>
          <p className="page-subtitle">Visualizza tutti i turni confermati</p>
        </motion.div>

        {/* Month Selector */}
        <div className="card">
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-field"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('it-IT', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {/* Schedules Grid */}
        {isLoading ? (
            <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-white/25 mx-auto mb-4" />
              <p className="text-white/70 text-lg font-semibold mb-2">
              Nessun turno programmato per questo mese
            </p>
              <p className="text-sm text-white/50 mb-4">
              I turni vengono creati dall'amministratore dopo aver confermato le disponibilità
            </p>
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-white/80">
                💡 <strong>Come funziona:</strong>
              </p>
                <ol className="text-left text-sm text-white/70 mt-2 space-y-1">
                <li>1. Gli utenti danno la disponibilità</li>
                <li>2. L'admin conferma le disponibilità</li>
                <li>3. L'admin crea i turni assegnando i proclamatori</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule, index) => {
              const date = new Date(schedule.date);
              const warnings = getScheduleWarnings(schedule);
              const hasWarnings = warnings.length > 0;

              return (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card hover:shadow-xl transition-all ${
                    !schedule.isConfirmed ? 'border-yellow-400/30 bg-yellow-400/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${
                        hasWarnings ? 'bg-yellow-400/15 border border-yellow-400/20' : 'bg-purple-400/15 border border-purple-400/20'
                      }`}>
                        <Calendar className={`w-6 h-6 ${
                          hasWarnings ? 'text-yellow-200' : 'text-purple-200'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {date.getDate()} {date.toLocaleString('it-IT', { month: 'short' })}
                        </p>
                        <p className="text-sm text-white/60">
                          {DAY_NAMES[schedule.shift.day]}
                        </p>
                      </div>
                    </div>
                    {schedule.isConfirmed ? (
                      <span className="bg-green-400/15 text-green-200 border border-green-400/20 text-xs font-semibold px-3 py-1 rounded-full">
                        ✓ Confermato
                      </span>
                    ) : (
                      <span className="bg-yellow-400/15 text-yellow-200 border border-yellow-400/20 text-xs font-semibold px-3 py-1 rounded-full">
                        ⚠ Incompleto
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2 text-white/80">
                      <MapPin className="w-4 h-4 text-purple-300" />
                      <span className="text-sm font-medium text-white">{schedule.shift.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span className="text-sm text-white/80">
                        {schedule.shift.startTime} - {schedule.shift.endTime}
                      </span>
                    </div>
                  </div>

                  {!schedule.isConfirmed && (
                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-yellow-200 mb-1">⚠ Avvisi:</p>
                      {warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-yellow-200/90">
                          • {warning}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-white/60 mb-2">Assegnati:</p>
                    {schedule.assignedUsers.map((assignment, idx) => {
                      // Gestisce sia user popolato che non popolato
                      if (!assignment.user || typeof assignment.user === 'string') {
                        return (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 text-sm text-white/70 mb-1"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-white/40">Utente non disponibile</span>
                            <span className="text-xs text-white/50">
                              ({assignment.gender === 'male' ? 'Fratello' : 'Sorella'})
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 text-sm text-white/80 mb-1"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-white">
                            {assignment.user.firstName} {assignment.user.lastName}
                          </span>
                          <span className="text-xs text-white/50">
                            ({assignment.user.gender === 'male' ? 'Fratello' : 'Sorella'})
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pulsante Chat - visibile se l'utente è assegnato e il turno è confermato oppure ci sono almeno 2 fratelli */}
                  {(schedule.isConfirmed || schedule.assignedUsers.filter((u) => u.gender === 'male').length >= 2) &&
                    isUserAssigned(schedule) && (
                    <button
                      onClick={() => handleOpenChat(schedule._id)}
                      className="mt-4 w-full btn-primary flex items-center justify-center space-x-2 relative"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat di Gruppo</span>
                      {unreadCounts[schedule._id] > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {unreadCounts[schedule._id]}
                        </span>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default Schedule;
