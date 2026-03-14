import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// LISTAR CASAMENTOS
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const marriages = await (prisma as any).casamento.findMany({
            orderBy: { data: 'desc' }
        });

        const mapped = marriages.map((m: any) => {
            const d = new Date(m.data);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            return {
                id: m.idCasamento,
                groomName: m.nomeNoivo,
                groomIsMember: m.noivoMembro,
                brideName: m.nomeNoiva,
                brideIsMember: m.noivaMembro,
                date: `${year}-${month}-${day}`,
                time: m.hora,
                location: m.local,
                officiant: m.celebrante,
                status: m.status === 'EM_PROCESSO' ? 'IN_PROCESS' :
                    m.status === 'REALIZADO' ? 'PERFORMED' :
                        m.status === 'CANCELADO' ? 'CANCELED' : m.status,
                witnesses: m.testemunhas,
                documentationStatus: m.statusDocumento
            };
        });

        res.json(mapped);
    } catch (error) {
        next(error);
    }
});

// CRIAR CASAMENTO
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const statusMap: Record<string, string> = {
            'IN_PROCESS': 'EM_PROCESSO',
            'PERFORMED': 'REALIZADO',
            'CANCELED': 'CANCELADO'
        };

        const safeDate = new Date(`${data.date}T12:00:00`);

        const newMarriage = await (prisma as any).casamento.create({
            data: {
                nomeNoivo: data.groomName,
                noivoMembro: data.groomIsMember ?? true,
                nomeNoiva: data.brideName,
                noivaMembro: data.brideIsMember ?? true,
                data: safeDate,
                hora: data.time || null,
                local: data.location || null,
                celebrante: data.officiant || null,
                status: statusMap[data.status] || 'EM_PROCESSO',
                testemunhas: data.witnesses || null,
                statusDocumento: data.documentationStatus || 'PENDENTE'
            }
        });

        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'CREATE',
            entidade: 'MARRIAGE',
            entidadeId: newMarriage.idCasamento,
            dadosNovos: newMarriage,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newMarriage);
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR CASAMENTO
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const statusMap: Record<string, string> = {
            'IN_PROCESS': 'EM_PROCESSO',
            'PERFORMED': 'REALIZADO',
            'CANCELED': 'CANCELADO'
        };

        const previousData = await (prisma as any).casamento.findUnique({ where: { idCasamento: id } });

        const safeDate = data.date ? new Date(`${data.date}T12:00:00`) : undefined;

        const updated = await (prisma as any).casamento.update({
            where: { idCasamento: id },
            data: {
                nomeNoivo: data.groomName,
                noivoMembro: data.groomIsMember ?? true,
                nomeNoiva: data.brideName,
                noivaMembro: data.brideIsMember ?? true,
                data: safeDate,
                hora: data.time || null,
                local: data.location || null,
                celebrante: data.officiant || null,
                status: statusMap[data.status] || previousData?.status || 'EM_PROCESSO',
                testemunhas: data.witnesses || null,
                statusDocumento: data.documentationStatus || previousData?.statusDocumento || 'PENDENTE'
            }
        });

        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'UPDATE',
            entidade: 'MARRIAGE',
            entidadeId: id,
            dadosAnteriores: previousData,
            dadosNovos: updated,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// DELETAR CASAMENTO
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const previousData = await (prisma as any).casamento.findUnique({ where: { idCasamento: id } });

        await (prisma as any).casamento.delete({
            where: { idCasamento: id }
        });

        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'DELETE',
            entidade: 'MARRIAGE',
            entidadeId: id,
            dadosAnteriores: previousData,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json({ message: 'Casamento removido com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
