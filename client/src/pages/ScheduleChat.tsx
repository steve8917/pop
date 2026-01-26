import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { type Socket } from 'socket.io-client';
import { ArrowLeft, Send, Users, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createAppSocket } from '../utils/socket';

interface Message {
  _id?: string;
  user: {
    _id?: string;
    firstName: string;
    lastName: string;
    gender: string;
  };
  message: string;
  timestamp: Date;
}

interface Schedule {
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
      _id: string;
      firstName: string;
      lastName: string;
      gender: string;
    };
  }[];
}

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Lunedì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const ScheduleChat = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scheduleId || !user) return;

    // Carica info del turno
    loadSchedule();

    // Segna messaggi come letti
    markAsRead();

    // Connessione Socket.IO
    const newSocket = createAppSocket();

    newSocket.on('connect', () => {
      console.log('Schedule chat socket connected');
      newSocket.emit('join-schedule-chat', {
        scheduleId,
        userId: user.id
      });
    });

    newSocket.on('schedule-chat-history', (history: Message[]) => {
      setMessages(history);
      scrollToBottom();
    });

    newSocket.on('schedule-chat-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      // Segna come letto quando arriva un nuovo messaggio mentre sei nella chat
      markAsRead();
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-schedule-chat', {
          scheduleId,
          userId: user.id
        });
        newSocket.disconnect();
      }
    };
  }, [scheduleId, user]);

  const loadSchedule = async () => {
    try {
      const { data } = await api.get(`/schedule/${scheduleId}`);
      if (data?.schedule) {
        setSchedule(data.schedule);
      } else {
        toast.error('Turno non trovato');
        navigate('/schedule');
      }
    } catch (error: any) {
      console.error('Errore caricamento turno:', error);
      toast.error(error?.response?.data?.message || 'Errore caricamento turno');
      navigate('/schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markAsRead = async () => {
    try {
      await api.post(`/chat-room/${scheduleId}/mark-read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !user) return;

    socket.emit('send-schedule-message', {
      scheduleId,
      message: newMessage,
      userId: user.id,
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender
      }
    });

    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  const date = new Date(schedule.date);

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-4 p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <button
            onClick={() => navigate('/schedule')}
            className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Torna al Programma</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 px-5 py-4">
          <div className="bg-white/10 border border-white/10 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-200" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              Chat Turno - {DAY_NAMES[schedule.shift.day]} {date.getDate()}/{date.getMonth() + 1}
            </h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-white/70">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-white/60" />
                <span>{schedule.shift.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-white/60" />
                <span>{schedule.shift.startTime} - {schedule.shift.endTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Partecipanti */}
        <div className="px-5 pb-5 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2 text-sm text-white/70 mb-3">
            <Users className="w-4 h-4 text-white/60" />
            <span className="font-semibold">Partecipanti ({schedule.assignedUsers.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.assignedUsers.map((assignment, idx) => (
              <span
                key={idx}
                className="bg-purple-400/15 text-purple-200 border border-purple-400/20 text-xs px-3 py-1 rounded-full"
              >
                {assignment.user.firstName} {assignment.user.lastName}
                <span className="text-purple-200/80 ml-1">
                  ({assignment.user.gender === 'male' ? 'F' : 'S'})
                </span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 card p-0 overflow-hidden mb-4">
        <div className="h-full overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-white/50">
            <Send className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Nessun messaggio ancora</p>
            <p className="text-sm text-white/60">Inizia la conversazione con il tuo gruppo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const msgUserId = typeof msg.user === 'object' ? msg.user._id : msg.user;
              const isMyMessage = user?.id === msgUserId;

              const showAvatar = index === 0 ||
                (index > 0 &&
                  (typeof messages[index - 1].user === 'object' ? messages[index - 1].user._id : messages[index - 1].user) !== msgUserId
                );

              return (
                <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showAvatar && !isMyMessage && typeof msg.user === 'object' && (
                      <span className="text-xs font-medium text-white/70 mb-1 ml-2">
                        {msg.user.firstName} {msg.user.lastName}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMyMessage
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                          : 'bg-black/20 border border-white/10 text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMyMessage ? 'text-purple-100' : 'text-white/50'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-4">
        <div className="card p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-primary px-5 flex items-center space-x-2"
              title="Invia"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Invia</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChat;
