# Avvio Rapido - Sistema Turni

## Status Attuale

✅ **Backend**: Avviato su `http://localhost:5001`
✅ **Frontend**: Avviato su `http://localhost:5173`
✅ **MongoDB**: Connesso

## Accedere all'Applicazione

Apri il browser e vai su:
```
http://localhost:5173
```

## Primi Passi

### 1. Registra il primo utente (Admin)

1. Clicca su "Registrati"
2. Compila tutti i campi:
   - Nome
   - Cognome
   - Email
   - Password (minimo 8 caratteri)
   - Seleziona Genere (Fratello/Sorella)
3. Clicca "Registrati"

### 2. Promuovi utente ad Admin

Per ora, il primo utente registrato è un utente normale. Per renderlo admin:

**Opzione 1: Usando MongoDB Compass (Consigliato)**
1. Apri MongoDB Compass
2. Connetti a `mongodb://localhost:27017`
3. Seleziona database `tepustatuto`
4. Apri collection `users`
5. Trova il tuo utente
6. Modifica il campo `role` da `"user"` a `"admin"`
7. Salva

**Opzione 2: Usando mongosh (Terminal)**
```bash
mongosh
use tepustatuto
db.users.updateOne(
  { email: "tua_email@gmail.com" },
  { $set: { role: "admin" } }
)
exit
```

### 3. Ricarica la pagina

Fai logout e login nuovamente per vedere le funzionalità admin.

## Configurare le Email

Per ricevere email (benvenuto, conferme, etc.):

1. Apri il file `.env` nella root del progetto
2. Configura le credenziali email:

```env
EMAIL_USER=tua_email@gmail.com
EMAIL_PASSWORD=tua_app_password_qui
```

**Per Gmail:**
1. Vai su https://myaccount.google.com/security
2. Attiva "Verifica in due passaggi"
3. Vai su "Password per le app"
4. Genera una nuova password per "Mail"
5. Copia la password generata
6. Incollala nel file `.env` come `EMAIL_PASSWORD`

## Funzionalità Principali

### Come Utente Normale:
- ✅ Dare disponibilità per i turni
- ✅ Visualizzare il programma mensile
- ✅ Ricevere notifiche
- ✅ Vedere i propri turni assegnati

### Come Admin:
- ✅ Confermare o rifiutare disponibilità
- ✅ Creare programmi turni
- ✅ Gestire tutti gli utenti
- ✅ Visualizzare statistiche

## Turni Disponibili

- **Lunedì**: Careggi (09:30 - 11:30)
- **Giovedì**: Piazza Dalmazia (10:00 - 12:00)
- **Venerdì**: Social Hub Belfiore (15:30 - 17:30)
- **Sabato**: Piazza Dalmazia (09:00 - 11:00, 11:00 - 13:00)
- **Domenica**: Piazza SS. Annunziata (15:30 - 17:30)

## Comandi Utili

### Avviare tutto
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client

# Oppure in un solo terminal:
npm run dev
```

### Fermare i server
Premi `Ctrl+C` in entrambi i terminali

### Riavviare MongoDB
```bash
brew services restart mongodb-community
```

### Verificare che MongoDB sia attivo
```bash
brew services list | grep mongodb
```

### Pulire il database (ATTENZIONE: cancella tutti i dati!)
```bash
mongosh
use tepustatuto
db.dropDatabase()
exit
```

## Risoluzione Problemi

### Porta 5001 già in uso
```bash
lsof -ti:5001 | xargs kill -9
```

### MongoDB non si avvia
```bash
brew services restart mongodb-community
```

### Errori npm
```bash
rm -rf node_modules package-lock.json
npm install
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Il server non si riavvia automaticamente
Ferma con `Ctrl+C` e riavvia con `npm run server`

## Note di Sicurezza

### Prima di andare in produzione:

1. **Cambia JWT_SECRET** nel file `.env`:
   ```env
   JWT_SECRET=una_stringa_molto_lunga_e_casuale_qui
   ```

2. **Configura email reali** invece di quelle di test

3. **Usa MongoDB Atlas** invece di MongoDB locale

4. **Attiva HTTPS** per le connessioni sicure

5. **Cambia NODE_ENV** in production:
   ```env
   NODE_ENV=production
   ```

## Prossimi Passi

- [ ] Crea altri utenti di test
- [ ] Dai disponibilità come utente normale
- [ ] Conferma disponibilità come admin
- [ ] Crea programma mensile
- [ ] Testa le notifiche email

## Supporto

Se hai problemi:
1. Controlla che MongoDB sia avviato
2. Verifica che entrambi i server siano attivi
3. Controlla i log nel terminale
4. Verifica il file `.env` sia configurato correttamente

---

**Il sistema è pronto all'uso!** 🎉

Buon lavoro nella gestione dei turni di testimonianza pubblica!
