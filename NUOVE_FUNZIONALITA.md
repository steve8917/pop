# Nuove Funzionalità Aggiunte

## 1. Pagina Profilo (/profile)

La pagina profilo permette agli utenti di:

- **Visualizzare informazioni personali**
  - Nome e cognome
  - Email
  - Genere (Fratello/Sorella)
  - Ruolo (Admin/Proclamatore)

- **Gestire le proprie disponibilità**
  - Vedere tutte le disponibilità inviate
  - Controllare lo stato (In attesa, Confermata, Rifiutata)
  - Eliminare disponibilità in attesa
  - Vedere data e ora di invio

### Come Accedere
Clicca su "Profilo" nel menu di navigazione o vai su: http://localhost:5173/profile

---

## 2. Chat Proclamatori (/chat)

Sistema di chat in tempo reale per comunicare con gli altri proclamatori.

### Funzionalità:
- **Messaggi in tempo reale** - I messaggi appaiono istantaneamente
- **Contatore utenti online** - Vedi quanti proclamatori sono connessi
- **Storico messaggi** - Gli ultimi 50 messaggi vengono caricati automaticamente
- **Design moderno** - Messaggi propri in viola, degli altri in bianco
- **Timestamp** - Ogni messaggio mostra l'ora di invio
- **Identificazione utenti** - Nome, cognome e genere (Fratello/Sorella) visibili
- **Badge notifiche** - Badge rosso sul menu "Chat" quando ci sono nuovi messaggi (NUOVO!)

### Come Funziona:
1. Vai su "Chat" nel menu
2. Scrivi il tuo messaggio nella casella di testo
3. Premi "Invia" o premi Enter
4. Il messaggio viene inviato a tutti i proclamatori connessi in tempo reale

### Tecnologia:
- Utilizza Socket.IO per comunicazione real-time
- I messaggi vengono salvati nel database MongoDB
- Sincronizzazione automatica tra tutti gli utenti connessi
- ChatContext per gestione stato globale e contatore messaggi non letti

---

## Come Usare le Nuove Funzionalità

### Profilo:
```
1. Login → Menu → Profilo
2. Visualizza le tue informazioni
3. Scorri verso il basso per vedere le disponibilità
4. Clicca "Elimina" per rimuovere una disponibilità in attesa
```

### Chat:
```
1. Login → Menu → Chat
2. Vedi il numero di utenti online in alto a destra
3. Scrivi un messaggio
4. Premi "Invia"
5. I messaggi appaiono istantaneamente per tutti
```

---

## Navigazione Aggiornata

Il menu ora include:
- 🏠 **Dashboard** - Panoramica generale
- ✅ **Disponibilità** - Dai la tua disponibilità
- 📅 **Programma** - Vedi il programma mensile
- 💬 **Chat** - Comunica con i proclamatori (NUOVO!)
- 👤 **Profilo** - Gestisci il tuo profilo (NUOVO!)
- ⚙️ **Admin** - Solo per amministratori

---

## Note Tecniche

### Backend:
- Nuovo modello `Message` per salvare i messaggi
- Eventi Socket.IO per chat real-time:
  - `join-chat` - Entra nella chat
  - `send-message` - Invia messaggio
  - `chat-message` - Ricevi messaggio
  - `online-users` - Aggiornamento utenti online
  - `chat-history` - Carica storico
- Auto-creazione programmi quando l'admin conferma disponibilità

### Frontend:
- Nuovo componente `Profile.tsx`
- Nuovo componente `Chat.tsx`
- Nuovo context `ChatContext.tsx` per gestione stato chat globale
- Badge notifiche chat nel menu di navigazione
- Integrazione Socket.IO per messaggi real-time
- Animazioni con Framer Motion

---

## Prova Subito!

1. Apri http://localhost:5173
2. Fai login
3. Clicca su "Profilo" per vedere le tue informazioni
4. Clicca su "Chat" per iniziare a chattare!

---

**Le funzionalità sono già attive e funzionanti!** 🎉
