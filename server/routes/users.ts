import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// LISTAR USUÁRIOS
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await (prisma as any).usuario.findMany({
            orderBy: { nome: 'asc' }
        });

        const mapped = users.map((u: any) => ({
            id: u.idUsuario,
            name: u.nome,
            email: u.email,
            role: u.perfil === 'ADMIN' ? 'SUPER_ADMIN' :
                u.perfil === 'TESOUREIRO' ? 'TREASURER' :
                    u.perfil === 'SECRETARIO' ? 'SECRETARY' :
                        u.perfil === 'MEMBRO' ? 'USER' : u.perfil,
            lastLogin: u.ultimoLogin || new Date().toISOString(),
            photoUrl: u.photoUrl
        }));

        res.json(mapped);
    } catch (error) {
        next(error);
    }
});

export default router;
