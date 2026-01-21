import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, BookOpen, RefreshCcw, Trash2 } from 'lucide-react';
import api from '../utils/api';
import Alert from '../components/Alert';
import { useAuth } from '../contexts/AuthContext';

type ExperienceUser = {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
};

type Experience = {
  _id: string;
  user: ExperienceUser;
  userId?: string;
  content: string;
  createdAt: string;
};

const Experiences = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const remaining = useMemo(() => 2500 - content.length, [content.length]);

  const fetchExperiences = async () => {
    setError('');
    try {
      setLoading(true);
      const { data } = await api.get('/experiences?limit=50');
      setExperiences(Array.isArray(data?.experiences) ? data.experiences : []);
    } catch (e: any) {
      setExperiences([]);
      setError(e?.response?.data?.message || 'Errore nel caricamento delle esperienze');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Scrivi qualcosa prima di pubblicare.');
      return;
    }

    if (trimmed.length > 2500) {
      setError('Il contenuto è troppo lungo (max 2500 caratteri).');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/experiences', { content: trimmed });
      const created = data?.experience as Experience | undefined;
      if (created) {
        setExperiences((prev) => [created, ...prev]);
      } else {
        await fetchExperiences();
      }
      setContent('');
      setSuccess('Esperienza pubblicata.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore nella pubblicazione');
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete = (exp: any) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin';
    const ownerId = String(exp?.userId || exp?.user?._id || '');
    const isOwner = ownerId && ownerId === user.id;
    return isAdmin || isOwner;
  };

  const handleDelete = async (experienceId: string) => {
    setError('');
    setSuccess('');

    const ok = window.confirm('Vuoi eliminare questa esperienza?');
    if (!ok) return;

    const prev = experiences;
    setDeletingId(experienceId);
    setExperiences((list) => list.filter((x) => x._id !== experienceId));

    try {
      await api.delete(`/experiences/${experienceId}`);
      setSuccess('Esperienza eliminata.');
    } catch (e: any) {
      setExperiences(prev);
      setError(e?.response?.data?.message || 'Errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-200" />
          Esperienze
        </h1>
        <p className="page-subtitle text-center">
          Condividi (e leggi) esperienze avute durante il servizio all\'espositore.
        </p>
      </motion.div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-3">Scrivi una nuova esperienza</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field w-full min-h-[140px] resize-y rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            placeholder="Racconta cosa è successo, cosa hai imparato, un momento significativo…"
            maxLength={2500}
          />

          <div className="flex items-center justify-between">
            <p className={`text-sm ${remaining < 0 ? 'text-red-300' : 'text-white/60'}`}>
              {remaining} caratteri rimanenti
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Pubblico…' : 'Pubblica'}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Esperienze recenti</h2>
          <button
            onClick={fetchExperiences}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
            title="Aggiorna"
          >
            <RefreshCcw className="w-4 h-4" />
            Aggiorna
          </button>
        </div>

        {loading ? (
          <p className="text-white/60">Caricamento…</p>
        ) : experiences.length === 0 ? (
          <p className="text-white/60">Nessuna esperienza ancora. Inizia tu!</p>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">
                      {exp.user?.firstName} {exp.user?.lastName}
                      <span className="text-white/60 font-normal">
                        {' '}
                        · {exp.user?.gender === 'male' ? 'Fratello' : 'Sorella'}
                      </span>
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      {new Date(exp.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>

                  {canDelete(exp) && (
                    <button
                      onClick={() => handleDelete(exp._id)}
                      disabled={deletingId === exp._id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 disabled:opacity-60"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === exp._id ? 'Elimino…' : 'Elimina'}
                    </button>
                  )}
                </div>

                <p className="text-white/85 mt-3 whitespace-pre-wrap leading-relaxed">
                  {exp.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Experiences;
