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

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendResetPasswordEmail } from '../utils/email.service.js';

// ... (LISTAR USUÁRIOS remains as is)

// CRIAR USUÁRIO
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    const { nome, email, senha, perfil } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUser = await (prisma as any).usuario.create({
            data: {
                nome,
                email: email.toLowerCase(),
                senha: hashedPassword,
                perfil: perfil || 'MEMBRO',
                photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random`
            }
        });

        res.status(201).json({
            id: newUser.idUsuario,
            name: newUser.nome,
            email: newUser.email,
            role: newUser.perfil === 'ADMIN' ? 'SUPER_ADMIN' : newUser.perfil,
            lastLogin: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR USUÁRIO
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { nome, email, perfil, senha } = req.body;
    try {
        const updateData: any = {
            nome,
            email: email.toLowerCase(),
            perfil
        };

        if (senha && senha.trim() !== '') {
            console.log(`🔑 Atualizando senha para o usuário: ${id}`);
            updateData.senha = await bcrypt.hash(senha, 10);
        } else {
            console.log(`ℹ️ Nenhuma nova senha fornecida para o usuário: ${id}`);
        }

        const updated = await (prisma as any).usuario.update({
            where: { idUsuario: id },
            data: updateData
        });

        res.json({
            id: updated.idUsuario,
            name: updated.nome,
            email: updated.email,
            role: updated.perfil === 'ADMIN' ? 'SUPER_ADMIN' : updated.perfil,
            lastLogin: updated.ultimoLogin || new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

// EXCLUIR USUÁRIO
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        await (prisma as any).usuario.delete({
            where: { idUsuario: id }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// DISPARAR RECUPERAÇÃO MANUAL
router.post('/:id/reset-password', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const user = await (prisma as any).usuario.findUnique({ where: { idUsuario: id } });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

        const token = uuidv4();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);

        await (prisma as any).usuario.update({
            where: { idUsuario: id },
            data: { resetToken: token, resetTokenExpiry: expiry }
        });

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const origin = req.get('origin') || `${protocol}://${host}`;

        await sendResetPasswordEmail(user.email, token, origin);
        res.json({ message: 'E-mail de redefinição enviado com sucesso.' });
    } catch (error) {
        next(error);
    }
});

export default router;
