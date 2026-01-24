import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Trash2, Users, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'male' | 'female';
  role: 'admin' | 'user';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Errore durante il caricamento degli utenti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    const confirmed = window.confirm(`Confermi di voler eliminare ${fullName}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('Utente eliminato');
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Errore durante l\'eliminazione';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Utenti registrati</h1>
            <p className="page-subtitle">Gestisci gli utenti dell'applicazione</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna al pannello
            </Link>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-all"
            >
              <Users className="w-4 h-4" />
              Aggiorna
            </button>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-white/60">Nessun utente registrato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {users.map((user) => {
            const fullName = `${user.firstName} ${user.lastName}`;

            return (
              <div key={user._id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-lg">{fullName}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-400/15 text-purple-200 border border-purple-400/20">
                        {user.role === 'admin' ? 'Admin' : 'Utente'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                        {user.gender === 'male' ? 'Fratello' : 'Sorella'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          user.emailVerified
                            ? 'bg-green-400/15 text-green-200 border-green-400/20'
                            : 'bg-yellow-400/15 text-yellow-200 border-yellow-400/20'
                        }`}
                      >
                        {user.emailVerified ? 'Email verificata' : 'Email non verificata'}
                      </span>
                    </div>
                    <div className="text-sm text-white/70">{user.email}</div>
                    <div className="text-xs text-white/50">
                      Registrato il {new Date(user.createdAt).toLocaleDateString('it-IT')}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDeleteUser(user._id, fullName)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
