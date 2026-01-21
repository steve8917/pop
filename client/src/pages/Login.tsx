import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import Alert from '../components/Alert'; // Importa il componente Alert

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Aggiungi lo stato per l'errore
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) {
      setError(null); // Pulisci l'errore quando l'utente inizia a digitare
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Si è verificato un errore durante il login.';
      setError(errorMessage);
      console.error('Login error:', err);

      // Se email non verificata, facilitiamo il reinvio.
      if (err?.response?.status === 403 && err?.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        // Lasciamo comunque l'errore visibile, ma aggiungiamo un link diretto.
        // L'utente può cliccare su "Reinvia" sotto, con email già compilata.
      }
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
            <CalendarCheck className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Benvenuto</h1>
          <p className="text-gray-600">Sistema Turni - Testimonianza Pubblica</p>
        </div>

        {/* Messaggio di Errore */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert type="error" message={error} />
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  className="input-field pl-10"
                  placeholder="tua@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Dimenticata */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Password dimenticata?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Accedi</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Link Registrazione */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              Non hai un account?{' '}
              <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Registrati
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Non hai ricevuto l'email di verifica?{' '}
              <Link
                to={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Reinvia
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Importa icona mancante
import { Calendar as CalendarCheck } from 'lucide-react';

export default Login;
