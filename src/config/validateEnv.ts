/**
 * Validate required environment variables at startup
 * Prevents the application from starting with missing critical configuration
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'FRONTEND_URL'
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ ERRORE: Variabili d\'ambiente mancanti:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nAssicurati che il file .env contenga tutte le variabili richieste.');
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32) {
    console.error('❌ ERRORE: JWT_SECRET deve essere almeno 32 caratteri per sicurezza');
    process.exit(1);
  }

  console.log('✅ Tutte le variabili d\'ambiente sono configurate correttamente');
};
