import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// LISTAR EVENTOS
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await (prisma as any).evento.findMany({
            include: { responsavelRelacion: true },
            orderBy: { dataInicio: 'desc' }
        });

        const mappedEvents = events.map((e: any) => {
            // Fix timezone: extract date parts directly to avoid UTC shift
            const d = new Date(e.dataInicio);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            return {
                id: e.idEvento,
                title: e.nome,
                date: dateStr,
                time: e.horario || '08:00',
                category: e.categoria || 'SPECIAL',
                description: e.descricao || '',
                location: e.local || 'Sede',
                responsible: e.responsavelRelacion?.nomeCompleto || 'Admin',
                checkInList: [],
                invitedMemberIds: []
            };
        });

        res.json(mappedEvents);
    } catch (error) {
        next(error);
    }
});

// CRIAR EVENTO
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, date, time, category, description, location, responsible, invitedMemberIds } = req.body;

        if (!title || !date) {
            return res.status(400).json({ message: 'Título e data são obrigatórios' });
        }

        // Fix timezone: append T12:00:00 to prevent UTC date shift
        const safeDate = new Date(`${date}T12:00:00`);

        const newEvent = await (prisma as any).evento.create({
            data: {
                nome: title,
                dataInicio: safeDate,
                local: location || 'Sede',
                descricao: description || '',
            }
        });

        res.status(201).json({
            id: newEvent.idEvento,
            idEvento: newEvent.idEvento,
            title: newEvent.nome,
            date: date, // Return the original date string the user chose
            time: time || '08:00',
            category: category || 'SPECIAL',
            description: newEvent.descricao || '',
            location: newEvent.local || 'Sede',
            responsible: responsible || 'Admin',
            invitedMemberIds: invitedMemberIds || [],
            checkInList: []
        });
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR EVENTO
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, date, time, category, description, location, responsible } = req.body;

        const safeDate = date ? new Date(`${date}T12:00:00`) : undefined;

        const updated = await (prisma as any).evento.update({
            where: { idEvento: id },
            data: {
                nome: title,
                dataInicio: safeDate,
                local: location,
                descricao: description
            }
        });

        res.json({
            id: updated.idEvento,
            idEvento: updated.idEvento,
            title: updated.nome,
            date: date || updated.dataInicio.toISOString().split('T')[0],
            time: time || '08:00',
            category: category || 'SPECIAL',
            description: updated.descricao || '',
            location: updated.local || 'Sede',
            responsible: responsible || 'Admin'
        });
    } catch (error) {
        next(error);
    }
});

// EXCLUIR EVENTO
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await (prisma as any).evento.delete({ where: { idEvento: id } });
        res.json({ message: 'Evento excluído com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
