import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, CheckCircle, MessageCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import DashboardCarousel from '../components/DashboardCarousel';
import { dashboardCarouselSlides } from '../data/dashboardCarouselSlides';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const location = useLocation();

  // Socket.IO per notifiche chat in tempo reale
  useEffect(() => {
    let socket: any;
    if (user) {
      socket = io('http://localhost:5001', { withCredentials: true });
      socket.on('connect', () => {
        console.log('[DASHBOARD] Socket connected');
        socket.emit('authenticate', user.id);
      });
      socket.on('schedule-message-notification', (data: { scheduleId: string; senderId: string }) => {
        console.log('[DASHBOARD] Ricevuta notifica chat:', data);
        if (data.senderId !== user.id) {
          // Aggiorna il conteggio reale dei non letti
          fetchUnreadCounts();
        }
      });
    }
    // Polling iniziale per non perdere messaggi già presenti
    const fetchUnreadCounts = async () => {
      try {
        const { data } = await api.get('/chat-room/unread-counts');
        const unreadCounts = data.unreadCounts || data; // compatibilità con risposta
        const totalUnread = Object.values(unreadCounts).reduce((acc: number, val: unknown) => acc + (typeof val === 'number' ? val : 0), 0);
        console.log('[DASHBOARD] Unread count aggiornato:', totalUnread);
        setUnreadChatCount(Number(totalUnread));
      } catch (err) {
        setUnreadChatCount(0);
      }
    };
    fetchUnreadCounts();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  // Nascondi alert se l'utente è su /schedule o su una chat di turno
  useEffect(() => {
    if (location.pathname.startsWith('/schedule')) {
      setUnreadChatCount(0);
    }
  }, [location.pathname]);

  const cards = [
    {
      title: 'Dai la tua Disponibilità',
      description: 'Seleziona i turni per cui sei disponibile',
      icon: CheckCircle,
      link: '/availability',
      color: 'from-purple-600 to-pink-600'
    },
    {
      title: 'Programma del Mese',
      description: 'Visualizza il programma completo dei turni',
      icon: Calendar,
      link: '/schedule',
      color: 'from-blue-600 to-purple-600'
    },
    {
      title: 'Esperienze',
      description: 'Scrivi e leggi esperienze dal servizio',
      icon: BookOpen,
      link: '/experiences',
      color: 'from-emerald-600 to-teal-600'
    }
  ];

  if (user?.role === 'admin') {
    cards.push({
      title: 'Gestione Admin',
      description: 'Conferma disponibilità e gestisci turni',
      icon: Users,
      link: '/admin',
      color: 'from-pink-600 to-red-600'
    });
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {/* Alert Chat Banner */}
        {unreadChatCount > 0 && !location.pathname.startsWith('/schedule') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-400/10 border border-yellow-400/20 p-4 rounded-lg flex items-center space-x-4 shadow-md backdrop-blur"
          >
            <MessageCircle className="w-6 h-6 text-yellow-200" />
            <div className="flex-1">
              <span className="font-semibold text-yellow-100">Hai {unreadChatCount} nuovo/i messaggio/i nelle chat dei turni!</span>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-300 text-black hover:bg-yellow-200 transition-colors"
            >
              Vai ai Turni
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Benvenuto/a, {user?.firstName}!
          </h1>
          <p className="text-white/75">
            {user?.gender === 'male' ? 'Fratello' : 'Sorella'} - Sistema Gestione Turni
          </p>
        </motion.div>

        {/* Carosello Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="-mx-4 sm:-mx-6 lg:-mx-10"
        >
          <DashboardCarousel slides={dashboardCarouselSlides} />
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={card.link}>
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className={`bg-gradient-to-r ${card.color} p-4 rounded-xl inline-block mb-4`}>
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-white/70">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info Turni */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Turni Disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white mb-1">Lunedì</h3>
              <p className="text-sm text-white/70">Careggi - 09:30 - 11:30</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white mb-1">Giovedì</h3>
              <p className="text-sm text-white/70">Piazza Dalmazia - 10:00 - 12:00</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white mb-1">Venerdì</h3>
              <p className="text-sm text-white/70">Social Hub Belfiore - 15:30 - 17:30</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white mb-1">Sabato</h3>
              <p className="text-sm text-white/70">Piazza Dalmazia - 09:00 - 11:00, 11:00 - 13:00</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white mb-1">Domenica</h3>
              <p className="text-sm text-white/70">Piazza SS. Annunziata - 15:30 - 17:30</p>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default Dashboard;
