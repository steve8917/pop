import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Prefill: prima da querystring, poi da sessionStorage (salvato dopo login 403).
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('email') || '';
    const fromSession = sessionStorage.getItem('pendingVerificationEmail') || '';
    const nextEmail = fromQuery || fromSession;
    if (nextEmail) setEmail(nextEmail);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/resend-verification`,
        { email },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      setEmailSent(true);
      sessionStorage.removeItem('pendingVerificationEmail');
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(apiMessage || 'Errore durante l\'invio');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-4xl font-bold gradient-text mb-2">Reinvia Email</h1>
          <p className="text-gray-600">Ricevi un nuovo link di verifica</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-700 text-center">
                Inserisci il tuo indirizzo email per ricevere un nuovo link di verifica.
              </p>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="tua@email.com"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Invia Email di Verifica'
                )}
              </motion.button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-gray-900">Email Inviata!</h3>
              <p className="text-gray-600">
                Controlla la tua casella di posta e clicca sul link di verifica.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center space-x-2 mt-4"
              >
                <span>Vai al Login</span>
              </Link>
            </div>
          )}

          {/* Link per tornare al login */}
          {!emailSent && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-500 font-medium"
              >
                <ArrowLeft size={16} />
                <span>Torna al Login</span>
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResendVerification;
