import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carica variabili d'ambiente se non già caricate
if (!process.env.EMAIL_HOST) {
  dotenv.config();
}

// Debug: stampa le variabili d'ambiente (rimuovere in produzione)
console.log('📧 Email configuration:');
console.log('  HOST:', process.env.EMAIL_HOST);
console.log('  PORT:', process.env.EMAIL_PORT);
console.log('  USER:', process.env.EMAIL_USER);
console.log('  PASSWORD:', process.env.EMAIL_PASSWORD ? '***hidden***' : 'NOT SET');
console.log('  FROM:', process.env.EMAIL_FROM);

// Crea transporter in modo lazy per assicurarsi che le env vars siano caricate
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@tepustatuto.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    console.log(`Email inviata a ${options.to}`);
  } catch (error) {
    console.error('Errore invio email:', error);
    throw new Error('Impossibile inviare email');
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #667eea; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Benvenuto nel Sistema Turni!</h1>
        </div>
        <div class="content">
          <p>Caro/a <strong>${firstName}</strong>,</p>

          <p>Benvenuto/a nel sistema di gestione turni per la testimonianza pubblica! Siamo felici di averti con noi.</p>

          <div class="info-box">
            <h2>Come iniziare:</h2>
            <ol>
              <li><strong>Dare la tua disponibilità:</strong> Accedi alla sezione "Disponibilità" e seleziona i turni per cui sei disponibile</li>
              <li><strong>Ricevi la conferma:</strong> L'amministratore confermerà le tue disponibilità e riceverai una notifica via email</li>
              <li><strong>Controlla il programma:</strong> Visualizza il programma mensile completo nella sezione "Programma"</li>
            </ol>
          </div>

          <div class="info-box">
            <h2>Turni disponibili:</h2>
            <ul>
              <li><strong>Lunedì</strong> - Careggi (09:30 - 11:30)</li>
              <li><strong>Giovedì</strong> - Piazza Dalmazia (10:00 - 12:00)</li>
              <li><strong>Venerdì</strong> - Social Hub Belfiore (15:30 - 17:30)</li>
              <li><strong>Sabato</strong> - Piazza Dalmazia (09:00 - 11:00, 11:00 - 13:00)</li>
              <li><strong>Domenica</strong> - Piazza SS. Annunziata (15:30 - 17:30)</li>
            </ul>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/login" class="button">Accedi al Sistema</a>
          </p>

          <p>Se hai domande o hai bisogno di aiuto, non esitare a contattare l'amministratore.</p>

          <p>Che Geova ti benedica nel tuo servizio!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Benvenuto nel Sistema Turni Testimonianza Pubblica',
    html
  });
};

export const sendAvailabilityConfirmationEmail = async (
  email: string,
  firstName: string,
  shift: { day: string; location: string; startTime: string; endTime: string; date: string }
): Promise<void> => {
  const dayNames: { [key: string]: string } = {
    monday: 'Lunedì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .shift-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4ade80; border-radius: 5px; }
        h1 { margin: 0; font-size: 28px; }
        .success { color: #4ade80; font-size: 48px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Disponibilità Confermata!</h1>
        </div>
        <div class="content">
          <div class="success">✓</div>

          <p>Caro/a <strong>${firstName}</strong>,</p>

          <p>La tua disponibilità è stata <strong>confermata</strong>! Grazie per il tuo impegno nel servizio.</p>

          <div class="shift-box">
            <h2 style="margin-top: 0; color: #667eea;">Dettagli Turno</h2>
            <p><strong>Giorno:</strong> ${dayNames[shift.day]}, ${shift.date}</p>
            <p><strong>Luogo:</strong> ${shift.location}</p>
            <p><strong>Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
          </div>

          <p>Ricordati di controllare regolarmente il programma per eventuali aggiornamenti.</p>

          <p>Che Geova ti benedica!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Disponibilità Confermata - Turno Testimonianza Pubblica',
    html
  });
};

export const sendVerificationEmail = async (email: string, firstName: string, verificationUrl: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        h1 { margin: 0; font-size: 28px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verifica il Tuo Account</h1>
        </div>
        <div class="content">
          <p>Caro/a <strong>${firstName}</strong>,</p>

          <p>Grazie per esserti registrato al Sistema Turni Testimonianza Pubblica!</p>

          <p>Per completare la registrazione e accedere al sistema, devi verificare il tuo indirizzo email cliccando sul pulsante qui sotto:</p>

          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verifica Email</a>
          </p>

          <div class="info-box">
            <strong>⏱️ Nota:</strong> Questo link è valido per 24 ore. Se non verifichi la tua email entro questo tempo, dovrai registrarti nuovamente.
          </div>

          <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; color: #667eea; font-size: 12px;">${verificationUrl}</p>

          <p>Se non hai richiesto tu questa registrazione, ignora questa email.</p>

          <p>Che Geova ti benedica!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verifica il Tuo Account - Sistema Turni',
    html
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fef3c7; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reimpostazione Password</h1>
        </div>
        <div class="content">
          <p>Hai richiesto di reimpostare la tua password.</p>

          <p>Clicca sul pulsante qui sotto per procedere:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reimposta Password</a>
          </p>

          <div class="warning">
            <strong>⚠️ Attenzione:</strong> Questo link è valido per 1 ora. Se non hai richiesto tu questa reimpostazione, ignora questa email.
          </div>

          <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reimpostazione Password - Sistema Turni',
    html
  });
};
