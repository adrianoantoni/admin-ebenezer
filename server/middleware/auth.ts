import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../loadEnv.js';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('🔴 Middleware Auth: Token não fornecido');
        return res.status(401).json({ message: 'Token de acesso não fornecido' });
    }

    const JWT_SECRET = getJwtSecret();
    console.log(`🔵 Middleware Auth: Verificando token (Secret: ${JWT_SECRET === 'eclesia-secret-key-2025' ? 'DEFAULT' : 'ENV_LOADED'})`);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('❌ Middleware Auth: Falha na verificação do JWT:', err.message);
            console.log('Token recebido:', token.substring(0, 15) + '...');
            return res.status(403).json({ message: 'Token inválido ou expirado' });
        }
        console.log(`✅ Middleware Auth: Acesso concedido para usuário ${user.userId}`);
        req.user = user;
        next();
    });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso negado: Administrador necessário' });
    }
    next();
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acesso negado: Perfil sem permissão' });
        }
        next();
    };
};
