import { Response } from 'express';
import Experience from '../models/Experience';
import { AuthRequest } from '../types';

export const listExperiences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const experiences = await Experience.find()
      .populate('user', 'firstName lastName gender')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ experiences });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle esperienze' });
  }
};

export const createExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const content = String(req.body?.content || '').trim();

    if (!content) {
      res.status(400).json({ message: 'Scrivi un contenuto prima di pubblicare' });
      return;
    }

    if (content.length > 2500) {
      res.status(400).json({ message: 'Il contenuto è troppo lungo (max 2500 caratteri)' });
      return;
    }

    const experience = await Experience.create({
      user: req.user.userId,
      content
    });

    const populated = await Experience.findById(experience._id)
      .populate('user', 'firstName lastName gender');

    res.status(201).json({ experience: populated });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione dell\'esperienza' });
  }
};

export const deleteExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const experienceId = String(req.params.id || '').trim();
    if (!experienceId) {
      res.status(400).json({ message: 'ID esperienza non valido' });
      return;
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      res.status(404).json({ message: 'Esperienza non trovata' });
      return;
    }

    const isOwner = experience.user.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Non hai i permessi per eliminare questa esperienza' });
      return;
    }

    await experience.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'esperienza' });
  }
};
