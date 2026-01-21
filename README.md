# Sistema Turni - Testimonianza Pubblica

Sistema completo per la gestione dei turni di testimonianza pubblica con espositori, realizzato con Node.js, TypeScript, React e MongoDB.

## Caratteristiche Principali

- ✅ Registrazione e autenticazione utenti
- ✅ Sistema di reset password
- ✅ Gestione disponibilità per turni
- ✅ Dashboard admin per confermare disponibilità
- ✅ Programma mensile visibile a tutti gli utenti
- ✅ Notifiche in tempo reale con Socket.IO
- ✅ Email automatiche (benvenuto, conferme)
- ✅ Logout automatico dopo 10 minuti di inattività
- ✅ Protezione con max 5 tentativi di login
- ✅ Regole turni (min 1 fratello, 1-2 sorelle)
- ✅ Grafica moderna con colori viola/lilla
- ✅ Animazioni fluide con Framer Motion
- ✅ Responsive design

## Turni Disponibili

- **Lunedì**: Careggi (09:30 - 11:30)
- **Giovedì**: Piazza Dalmazia (10:00 - 12:00)
- **Venerdì**: Social Hub Belfiore (15:30 - 17:30)
- **Sabato**: Piazza Dalmazia (09:00 - 11:00, 11:00 - 13:00)
- **Domenica**: Piazza SS. Annunziata (15:30 - 17:30)

## Requisiti

- Node.js (v18 o superiore)
- MongoDB (v6 o superiore)
- npm o yarn

## Installazione

### 1. Installa MongoDB

**Su macOS con Homebrew:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Clona il repository e installa le dipendenze

```bash
cd tepustatuto

# Installa dipendenze backend
npm install

# Installa dipendenze frontend
cd client
npm install
cd ..
```

### 3. Configura le variabili d'ambiente

Il file `.env` è già creato nella root del progetto. Modifica i seguenti valori:

```bash
# Email Configuration - IMPORTANTE!
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tua_email@gmail.com
EMAIL_PASSWORD=tua_app_password_gmail
```

**Per Gmail:**
1. Vai su https://myaccount.google.com/security
2. Attiva l'autenticazione a due fattori
3. Genera una "Password per le app"
4. Usa quella password nel file .env

### 4. Avvia l'applicazione

Apri **DUE** terminali:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

Oppure in un solo terminale:
```bash
npm run dev
```

### 5. Accedi all'applicazione

Apri il browser su: `http://localhost:5173`

## Primo Utilizzo

### Creare un Admin

1. Registrati normalmente attraverso il form di registrazione
2. Apri MongoDB Compass o mongosh
3. Connettiti a `mongodb://localhost:27017`
4. Seleziona il database `tepustatuto`
5. Trova il tuo utente nella collection `users`
6. Modifica il campo `role` da `"user"` a `"admin"`

```javascript
// In mongosh:
use tepustatuto
db.users.updateOne(
  { email: "tua_email@gmail.com" },
  { $set: { role: "admin" } }
)
```

## Struttura del Progetto

```
tepustatuto/
├── src/                    # Backend
│   ├── models/            # Modelli MongoDB
│   ├── controllers/       # Controller API
│   ├── routes/           # Route Express
│   ├── middleware/       # Middleware autenticazione
│   ├── config/           # Configurazione DB
│   ├── utils/            # Utilities (JWT, Email)
│   └── server.ts         # Entry point server
│
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/   # Componenti React
│   │   ├── pages/        # Pagine dell'app
│   │   ├── contexts/     # Context API (Auth, Notifications)
│   │   ├── utils/        # Utilities (API client)
│   │   └── styles/       # CSS e Tailwind
│   └── index.html
│
├── .env                  # Variabili d'ambiente
└── package.json
```

## Funzionalità Dettagliate

### Autenticazione
- Registrazione con nome, cognome, email, password e genere
- Login con protezione (max 5 tentativi, account bloccato per 2 ore)
- Reset password via email
- Logout automatico dopo 10 minuti di inattività

### Disponibilità
- Visualizzazione calendario mensile
- Selezione multipla turni
- Invio disponibilità all'admin
- Notifiche di conferma via email

### Admin
- Dashboard per gestire tutte le disponibilità
- Conferma o rifiuta disponibilità
- Visualizzazione statist iche
- Creazione programma turni

### Programma
- Visualizzazione mensile completa
- Informazioni turni assegnati
- Filtraggio per mese/anno

### Notifiche
- Notifiche in tempo reale con Socket.IO
- Alert audio per nuove notifiche
- Badge contatore notifiche non lette
- Storico notifiche

## API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dati utente corrente
- `POST /api/auth/forgot-password` - Richiesta reset password
- `POST /api/auth/reset-password` - Reset password

### Disponibilità
- `POST /api/availability` - Invia disponibilità
- `GET /api/availability/my` - Le mie disponibilità
- `GET /api/availability/all` - Tutte (solo admin)
- `PATCH /api/availability/:id/status` - Aggiorna stato (solo admin)
- `DELETE /api/availability/:id` - Elimina disponibilità

### Programma
- `POST /api/schedule` - Crea turno (solo admin)
- `GET /api/schedule/monthly` - Programma mensile
- `GET /api/schedule/my` - I miei turni
- `PUT /api/schedule/:id` - Modifica turno (solo admin)
- `DELETE /api/schedule/:id` - Elimina turno (solo admin)

### Notifiche
- `GET /api/notifications` - Le mie notifiche
- `PATCH /api/notifications/:id/read` - Segna come letta
- `PATCH /api/notifications/read-all` - Segna tutte come lette
- `DELETE /api/notifications/:id` - Elimina notifica

## Tecnologie Utilizzate

### Backend
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- Socket.IO (notifiche real-time)
- JWT (autenticazione)
- Nodemailer (email)
- bcryptjs (password hashing)

### Frontend
- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS
- Framer Motion (animazioni)
- Axios
- Socket.IO Client
- React Hot Toast (notifiche UI)
- Lucide React (icone)

## Risoluzione Problemi

### MongoDB non si avvia
```bash
# Controlla lo stato
brew services list

# Riavvia MongoDB
brew services restart mongodb-community
```

### Errori di compilazione TypeScript
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Email non funzionano
- Verifica di aver configurato correttamente EMAIL_USER e EMAIL_PASSWORD
- Per Gmail, usa una "Password per le app", non la tua password normale
- Controlla che l'autenticazione a due fattori sia attiva

### Porta già in uso
```bash
# Trova e termina il processo sulla porta 5000
lsof -ti:5000 | xargs kill -9

# Trova e termina il processo sulla porta 5173
lsof -ti:5173 | xargs kill -9
```

## Sviluppo Futuro

Possibili migliorie:
- [ ] Dashboard con statistiche avanzate
- [ ] Export programma in PDF
- [ ] Notifiche push browser
- [ ] App mobile con React Native
- [ ] Sistema di sostituzioni
- [ ] Chat tra proclamatori
- [ ] Calendario condiviso (iCal)

## Supporto

Per problemi o domande, apri una issue nel repository o contatta lo sviluppatore.

## Licenza

Questo progetto è stato creato per uso interno della congregazione.

---

**Che Geova benedica il vostro servizio!** 🙏
