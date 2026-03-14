import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// LISTAR DEPARTAMENTOS (MINISTÉRIOS)
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const departments = await (prisma as any).ministerio.findMany({
            include: { liderRelacion: true },
            orderBy: { nome: 'asc' }
        });

        const mapped = departments.map((d: any) => ({
            id: d.idMinisterio,
            name: d.nome,
            description: d.descricao,
            leaderName: d.liderRelacion?.nomeCompleto || 'Sem Líder',
            status: d.ativo ? 'ACTIVE' : 'INACTIVE'
        }));

        res.json(mapped);
    } catch (error) {
        next(error);
    }
});

export default router;
