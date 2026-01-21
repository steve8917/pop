import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

// Carica variabili d'ambiente
dotenv.config();

const migrateExistingUsers = async () => {
  try {
    // Connetti al database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tepustatuto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connesso al database');

    // Trova tutti gli utenti che non hanno emailVerified impostato
    const usersToUpdate = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: false }
      ]
    });

    console.log(`📊 Trovati ${usersToUpdate.length} utenti da aggiornare`);

    if (usersToUpdate.length === 0) {
      console.log('✨ Nessun utente da aggiornare');
      process.exit(0);
    }

    // Aggiorna tutti gli utenti esistenti impostando emailVerified a true
    const result = await User.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: false }
        ]
      },
      {
        $set: { emailVerified: true }
      }
    );

    console.log(`✅ Aggiornati ${result.modifiedCount} utenti`);
    console.log('🎉 Migrazione completata con successo!');

    // Mostra gli utenti aggiornati
    console.log('\n📋 Utenti aggiornati:');
    for (const user of usersToUpdate) {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
};

migrateExistingUsers();
