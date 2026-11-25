// ==============================================================================
// SECUREVAULT - CONTROLADOR DE NOTAS PRIVADAS
// ==============================================================================

import { notesService } from '../services/notes.service.js';

export const notesController = {
  async create(req, res, next) {
    try {
      const { title, content } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const note = await notesService.createNote({
        userId: req.user.id,
        title,
        content,
        ipAddress,
        userAgent,
      });

      return res.status(201).json({
        success: true,
        message: 'Nota privada creada y cifrada exitosamente.',
        data: {
          note,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const note = await notesService.getNoteById({
        userId: req.user.id,
        id,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        data: {
          note,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const take = req.query.take ? Number(req.query.take) : 50;

      const notes = await notesService.getUserNotes({
        userId: req.user.id,
        skip,
        take,
      });

      return res.status(200).json({
        success: true,
        data: {
          notes,
          count: notes.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const note = await notesService.updateNote({
        userId: req.user.id,
        id,
        title,
        content,
        ipAddress,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: 'Nota actualizada y recifrada exitosamente.',
        data: {
          note,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await notesService.deleteNote({
        userId: req.user.id,
        id,
        ipAddress,
        userAgent,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
