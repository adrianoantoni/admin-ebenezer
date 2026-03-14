import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// LISTAR TURMAS
router.get('/classes', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classes = await (prisma as any).escolaTurma.findMany({
            include: { presencas: true },
            orderBy: { nome: 'asc' }
        });

        const mapped = classes.map((c: any) => ({
            id: c.idTurma,
            name: c.nome,
            teacherName: c.professor,
            ageGroup: c.faixaEtaria,
            room: c.sala,
            studentsCount: Array.isArray(c.estudantesIds) ? c.estudantesIds.length : 0,
            studentIds: Array.isArray(c.estudantesIds) ? c.estudantesIds : [],
            status: c.ativo ? 'ACTIVE' : 'INACTIVE',
            attendance: c.presencas.map((p: any) => ({
                date: p.data.toISOString().split('T')[0],
                presentStudentIds: Array.isArray(p.estudantesPresentes) ? p.estudantesPresentes : []
            }))
        }));

        res.json(mapped);
    } catch (error) {
        next(error);
    }
});

// MATRICULAR ALUNO
router.post('/classes/:id/enroll', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
        // Verificar se o aluno já está em outra turma
        const existingClass = await (prisma as any).escolaTurma.findFirst({
            where: {
                estudantesIds: {
                    array_contains: memberId
                }
            }
        });

        if (existingClass) {
            return res.status(400).json({
                message: `Este aluno já está matriculado na turma: ${existingClass.nome}`
            });
        }

        const turma = await (prisma as any).escolaTurma.findUnique({
            where: { idTurma: id }
        });

        if (!turma) return res.status(404).json({ message: 'Turma não encontrada' });

        const students = Array.isArray(turma.estudantesIds) ? turma.estudantesIds : [];
        if (!students.includes(memberId)) {
            students.push(memberId);
        }

        const updated = await (prisma as any).escolaTurma.update({
            where: { idTurma: id },
            data: { estudantesIds: students }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'UPDATE',
            entidade: 'SCHOOL_CLASS',
            entidadeId: id,
            dadosNovos: updated,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR TURMA
router.put('/classes/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = await (prisma as any).escolaTurma.update({
            where: { idTurma: id },
            data: {
                nome: data.name,
                professor: data.teacherName,
                faixaEtaria: data.ageGroup,
                sala: data.room,
                ativo: data.status === 'ACTIVE'
            }
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// REMOVER ALUNO DA TURMA
router.delete('/classes/:id/students/:memberId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id, memberId } = req.params;
    try {
        const turma = await (prisma as any).escolaTurma.findUnique({
            where: { idTurma: id }
        });

        if (!turma) return res.status(404).json({ message: 'Turma não encontrada' });

        const students = Array.isArray(turma.estudantesIds) ? turma.estudantesIds : [];
        const filtered = students.filter((sid: string) => sid !== memberId);

        const updated = await (prisma as any).escolaTurma.update({
            where: { idTurma: id },
            data: { estudantesIds: filtered }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// SALVAR PRESENÇA
router.post('/classes/:id/attendance', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { date, presentIds } = req.body;
    try {
        // Upsert presenca para a data
        const existing = await (prisma as any).escolaPresenca.findFirst({
            where: { idTurma: id, data: new Date(date) }
        });

        if (existing) {
            await (prisma as any).escolaPresenca.update({
                where: { idPresenca: existing.idPresenca },
                data: { estudantesPresentes: presentIds }
            });
        } else {
            await (prisma as any).escolaPresenca.create({
                data: {
                    idTurma: id,
                    data: new Date(date),
                    estudantesPresentes: presentIds
                }
            });
        }

        res.json({ message: 'Presença salva com sucesso' });
    } catch (error) {
        next(error);
    }
});

// CRIAR TURMA
router.post('/classes', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const newClass = await (prisma as any).escolaTurma.create({
            // ... (keep data)
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'CREATE',
            entidade: 'SCHOOL_CLASS',
            entidadeId: newClass.idTurma,
            dadosNovos: newClass,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newClass);
    } catch (error) {
        next(error);
    }
});

export default router;
