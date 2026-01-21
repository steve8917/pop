import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { User, Mail, Calendar, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Availability {
  _id: string;
  shift: {
    day: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}


const Profile = () => {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyAvailabilities();
  }, []);

  const fetchMyAvailabilities = async () => {
    try {
      const { data } = await api.get('/availability/my');
      setAvailabilities(data.availabilities);
    } catch (error) {
      console.error('Errore caricamento disponibilità:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa disponibilità?')) return;

    try {
      await api.delete(`/availability/${id}`);
      toast.success('Disponibilità eliminata');
      fetchMyAvailabilities();
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-400/15 text-green-200 border border-green-400/20 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Confermata
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-400/15 text-red-200 border border-red-400/20 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rifiutata
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-400/15 text-yellow-200 border border-yellow-400/20 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            In attesa
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Il mio Profilo</h1>
        <p className="page-subtitle">Gestisci le tue informazioni e disponibilità</p>
      </motion.div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-white/70">
              {user?.gender === 'male' ? 'Fratello' : 'Sorella'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
            <Mail className="w-5 h-5 text-purple-300" />
            <div>
              <p className="text-sm text-white/70">Email</p>
              <p className="font-medium text-white">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-300" />
            <div>
              <p className="text-sm text-white/70">Ruolo</p>
              <p className="font-medium text-white">
                {user?.role === 'admin' ? 'Amministratore' : 'Proclamatore'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Availabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Le mie Disponibilità</h2>
          <span className="text-sm text-white/60">
            {availabilities.length} disponibilità totali
          </span>
        </div>

        {isLoading ? (
          <div className="card flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
          </div>
        ) : availabilities.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-white/25 mx-auto mb-4" />
            <p className="text-white/60 mb-4">Non hai ancora dato nessuna disponibilità</p>
            <a
              href="/availability"
              className="btn-primary inline-block"
            >
              Dai la tua disponibilità
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {availabilities.map((availability) => {
              const date = new Date(availability.date);

              return (
                <motion.div
                  key={availability._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-purple-200">
                          {date.toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        {getStatusBadge(availability.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-white/60">Luogo: </span>
                          <span className="font-medium text-white">
                            {availability.shift.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Orario: </span>
                          <span className="font-medium text-white">
                            {availability.shift.startTime} - {availability.shift.endTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Inviata il: </span>
                          <span className="font-medium text-white">
                            {new Date(availability.createdAt).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {availability.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(availability._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-400/15 text-red-200 border border-red-400/20 hover:bg-red-400/25 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
