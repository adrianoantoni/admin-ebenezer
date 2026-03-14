import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.ts';
import { getJwtSecret } from '../loadEnv.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';
import { sendResetPasswordEmail } from '../utils/email.service.ts';
import { logAudit } from '../utils/audit.ts';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    console.log(`🔵 Tentativa de login recebida para: ${email}`);

    const JWT_SECRET = getJwtSecret();
    console.log(`🔵 Usando JWT_SECRET: ${JWT_SECRET === 'eclesia-secret-key-2025' ? 'DEFAULT' : 'ENV_FILE'}`);

    try {
        const user = await (prisma as any).usuario.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            },
        });

        if (!user) {
            console.log(`❌ Login falhou: Usuário não encontrado no banco (${email})`);
            return res.status(401).json({ message: 'E-mail não cadastrado no sistema.' });
        }

        console.log(`✅ Usuário encontrado: ${user.nome} (ID: ${user.idUsuario})`);

        const isPasswordValid = await bcrypt.compare(password, user.senha);
        console.log(`🔵 Comparação de senha: ${isPasswordValid ? 'SUCESSO' : 'FALHA'}`);

        if (!isPasswordValid) {
            console.log(`❌ Login falhou: Senha incorreta para ${email}`);
            return res.status(401).json({ message: 'Senha incorreta. Tente novamente.' });
        }

        const token = jwt.sign(
            { userId: user.idUsuario, role: user.perfil },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Atualizar último login
        const now = new Date();
        await (prisma as any).usuario.update({
            where: { idUsuario: user.idUsuario },
            data: { ultimoLogin: now },
        });

        // Registrar log de auditoria para login
        await logAudit({
            usuarioId: user.idUsuario,
            acao: 'LOGIN',
            entidade: 'USER',
            entidadeId: user.idUsuario,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'SUCCESS'
        });

        // Mapear para o formato do frontend
        const mappedUser = {
            id: user.idUsuario,
            name: user.nome,
            email: user.email,
            role: user.perfil === 'ADMIN' ? 'SUPER_ADMIN' :
                user.perfil === 'TESOUREIRO' ? 'TREASURER' :
                    user.perfil === 'SECRETARIO' ? 'SECRETARY' :
                        user.perfil === 'MEMBRO' ? 'USER' : user.perfil,
            lastLogin: (user.ultimoLogin || now).toISOString(),
            photoUrl: user.photoUrl
        };

        res.json({
            user: mappedUser,
            token,
        });
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR PERFIL (Nome e Foto)
router.put('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { name, photoUrl } = req.body;
    const userId = (req as any).user.userId;

    console.log(`🔵 Atualizando perfil do usuário ${userId}: Nome=${name}, Foto=${photoUrl ? 'PRESENTE' : 'AUSENTE'}`);

    try {
        const updatedUser = await (prisma as any).usuario.update({
            where: { idUsuario: userId },
            data: {
                nome: name,
                photoUrl: photoUrl
            },
        });

        const mappedUser = {
            id: updatedUser.idUsuario,
            name: updatedUser.nome,
            email: updatedUser.email,
            role: updatedUser.perfil === 'ADMIN' ? 'SUPER_ADMIN' :
                updatedUser.perfil === 'TESOUREIRO' ? 'TREASURER' :
                    updatedUser.perfil === 'SECRETARIO' ? 'SECRETARY' :
                        updatedUser.perfil === 'MEMBRO' ? 'USER' : updatedUser.perfil,
            lastLogin: updatedUser.ultimoLogin ? updatedUser.ultimoLogin.toISOString() : new Date().toISOString(),
            photoUrl: updatedUser.photoUrl
        };

        console.log(`✅ Perfil atualizado com sucesso para usuário ${userId}`);
        res.json(mappedUser);
    } catch (error) {
        console.error(`❌ Erro ao atualizar perfil do usuário ${userId}:`, error);
        next(error);
    }
});

// SOLICITAR RECUPERAÇÃO DE SENHA
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    console.log(`🔵 Solicitação de recuperação de senha para: ${email}`);

    try {
        const user = await (prisma as any).usuario.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Por segurança, não confirmamos se o e-mail existe, mas logamos internamente
            console.log(`⚠️ Tentativa de recuperação para e-mail inexistente: ${email}`);
            return res.json({ message: 'Se este e-mail estiver cadastrado, você receberá instruções em breve.' });
        }

        const token = uuidv4();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // Token válido por 1 hora

        await (prisma as any).usuario.update({
            where: { idUsuario: user.idUsuario },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });

        await sendResetPasswordEmail(user.email, token);

        res.json({ message: 'Instruções de recuperação enviadas para o seu e-mail.' });
    } catch (error) {
        console.error('❌ Erro no forgot-password:', error);
        next(error);
    }
});

// REDEFINIR SENHA COM TOKEN
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = req.body;
    console.log(`🔵 Tentativa de redefinição de senha com token: ${token ? 'PRESENTE' : 'AUSENTE'}`);

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    try {
        const user = await (prisma as any).usuario.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            console.log('❌ Token de redefinição inválido ou expirado');
            return res.status(400).json({ message: 'Link de recuperação inválido ou expirado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await (prisma as any).usuario.update({
            where: { idUsuario: user.idUsuario },
            data: {
                senha: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        console.log(`✅ Senha redefinida com sucesso para o usuário ${user.idUsuario}`);
        res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
    } catch (error) {
        console.error('❌ Erro no reset-password:', error);
        next(error);
    }
});

export default router;
