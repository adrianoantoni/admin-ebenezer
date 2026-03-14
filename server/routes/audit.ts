import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = Router();

// Buscar todos os logs (Apenas ADMIN)
router.get('/', authenticateToken, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await (prisma as any).auditLog.findMany({
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true,
                        photoUrl: true,
                        membro: {
                            select: {
                                telefone: true,
                                fotoPerfil: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 100 // Limitar aos últimos 100 para performance inicial
        });

        // Mapear para o formato que o frontend espera
        const mappedLogs = logs.map((log: any) => ({
            id: log.id, // Prisma UUID id
            userId: log.usuarioId,
            userName: log.usuario.nome,
            userEmail: log.usuario.email,
            userPhone: log.usuario.membro?.telefone || 'N/A',
            userPhotoUrl: log.usuario.photoUrl || log.usuario.membro?.fotoPerfil || null,
            action: `${log.acao} - ${log.entidade}`,
            category: log.acao === 'LOGIN' ? 'LOGIN' : mapEntityToCategory(log.entidade),
            severity: mapActionToSeverity(log.acao),
            target: log.entidadeId || 'N/A',
            timestamp: log.timestamp.toISOString(),
            ip: log.ipAddress || '0.0.0.0',
            details: JSON.stringify({
                dadosAnteriores: log.dadosAnteriores,
                dadosNovos: log.dadosNovos,
                userAgent: log.userAgent,
                status: log.status
            })
        }));

        res.json(mappedLogs);
    } catch (error) {
        next(error);
    }
});

function mapEntityToCategory(entity: string): string {
    const mapping: Record<string, string> = {
        'USER': 'SECURITY',
        'MEMBER': 'MEMBERS',
        'TRANSACTION': 'FINANCE',
        'ASSET': 'ASSETS',
        'MARRIAGE': 'MARRIAGE',
        'EVENT': 'SYSTEM',
        'SCHOOL_CLASS': 'SCHOOL',
        'CELL': 'CELLS',
        'SETTING': 'SYSTEM'
    };
    return mapping[entity] || 'SYSTEM';
}

function mapActionToSeverity(action: string): string {
    if (action === 'DELETE' || action === 'ANNUL' || action === 'PASSWORD_RESET') return 'HIGH';
    if (action === 'UPDATE' || action === 'LOGIN') return 'MEDIUM';
    return 'LOW';
}

export default router;
