import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    let redirectTimeout: number | undefined;

    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token di verifica mancante');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await axios.post(
          `${apiUrl}/api/auth/verify-email`,
          { token },
          { withCredentials: true, signal: controller.signal }
        );

        if (!isActive) return;
        setStatus('success');
        setMessage(response.data.message);
        toast.success('Email verificata con successo!');

        // Reindirizza al login dopo 3 secondi
        redirectTimeout = window.setTimeout(() => {
          if (!isActive) return;
          navigate('/login');
        }, 3000);
      } catch (error: unknown) {
        if (!isActive) return;

        const apiMessage = axios.isAxiosError(error)
          ? error.response?.data?.message
          : undefined;

        setStatus('error');
        setMessage(apiMessage || 'Errore durante la verifica');
        toast.error('Verifica fallita');
      }
    };

    verifyEmail();

    return () => {
      isActive = false;
      controller.abort();
      if (redirectTimeout) window.clearTimeout(redirectTimeout);
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo e Titolo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-4"
          >
            <Mail className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Verifica Email</h1>
          <p className="text-gray-600">Sistema Turni - Testimonianza Pubblica</p>
        </div>

        {/* Card con stato */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="text-center py-8">
            {status === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Loader className="w-16 h-16 text-purple-600 mx-auto animate-spin" />
                <p className="text-lg text-gray-700 font-medium">Verifica in corso...</p>
                <p className="text-sm text-gray-500">Attendere prego</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="space-y-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg text-gray-700 font-medium">{message}</p>
                <p className="text-sm text-gray-500">Verrai reindirizzato alla pagina di login...</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <span>Vai al Login</span>
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="space-y-4"
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <p className="text-lg text-gray-700 font-medium">Verifica Fallita</p>
                <p className="text-sm text-gray-600">{message}</p>
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-gray-500">
                    Il link potrebbe essere scaduto o non valido.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => navigate('/resend-verification')}
                      className="btn-primary inline-flex items-center justify-center space-x-2"
                    >
                      <span>Richiedi Nuovo Link</span>
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="text-purple-600 hover:text-purple-500 font-medium"
                    >
                      Torna alla Registrazione
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
