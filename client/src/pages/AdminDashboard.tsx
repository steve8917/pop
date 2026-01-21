import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Availability {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
  };
  shift: {
    day: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Lunedì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const AdminDashboard = () => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAvailabilities();
  }, [filter]);

  const fetchAvailabilities = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/availability/all', { params });
      setAvailabilities(data.availabilities);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await api.patch(`/availability/${id}/status`, { status });
      toast.success(`Disponibilità ${status === 'confirmed' ? 'confermata' : 'rifiutata'}!`);
      fetchAvailabilities();
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const pending = availabilities.filter(a => a.status === 'pending');
  const confirmed = availabilities.filter(a => a.status === 'confirmed');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Gestione Admin</h1>
        <p className="page-subtitle">Conferma le disponibilità dei proclamatori</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-yellow-400/10 border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">In Attesa</p>
              <p className="text-3xl font-bold text-yellow-200">{pending.length}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-green-400/10 border-green-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Confermate</p>
              <p className="text-3xl font-bold text-green-200">{confirmed.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-purple-400/10 border-purple-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Totali</p>
              <p className="text-3xl font-bold text-purple-200">{availabilities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            In Attesa
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'confirmed'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Confermate
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Tutte
          </button>
        </div>
      </div>

      {/* Availabilities List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
        </div>
      ) : availabilities.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-white/60">Nessuna disponibilità da mostrare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availabilities.map((availability) => {
            const date = new Date(availability.date);

            return (
              <motion.div
                key={availability._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg text-white">
                        {availability.user.firstName} {availability.user.lastName}
                      </span>
                      <span className="text-sm px-2 py-1 bg-purple-400/15 text-purple-200 border border-purple-400/20 rounded">
                        {availability.user.gender === 'male' ? 'Fratello' : 'Sorella'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-white/70">
                      <div>
                        <span className="font-medium text-white/80">Data:</span>{' '}
                        {date.toLocaleDateString('it-IT')}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Giorno:</span>{' '}
                        {DAY_NAMES[availability.shift.day]}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Luogo:</span> {availability.shift.location}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Orario:</span>{' '}
                        {availability.shift.startTime} - {availability.shift.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {availability.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(availability._id, 'confirmed')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Conferma
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(availability._id, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Rifiuta
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-4 py-2 rounded-lg font-medium ${
                          availability.status === 'confirmed'
                            ? 'bg-green-400/15 text-green-200 border border-green-400/20'
                            : 'bg-red-400/15 text-red-200 border border-red-400/20'
                        }`}
                      >
                        {availability.status === 'confirmed' ? 'Confermata' : 'Rifiutata'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
