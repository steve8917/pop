import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
      toast.success('Email di reset inviata!');
    } catch (error) {
      toast.error('Errore durante l\'invio dell\'email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full card"
      >
        <h2 className="text-3xl font-bold gradient-text text-center mb-6">
          Password Dimenticata?
        </h2>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 text-center">
              Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Invio...' : 'Invia Email'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl">✉️</div>
            <p className="text-gray-600">
              Abbiamo inviato le istruzioni per reimpostare la password all'indirizzo{' '}
              <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">Controlla anche la cartella spam</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-purple-600 hover:text-purple-500">
            Torna al Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
