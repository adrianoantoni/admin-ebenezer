import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Helper to map Prisma → Frontend field names
const mapToFrontend = (settings: any) => {
    if (!settings) return null;
    const { enderecoJson, redesSociais, ...rest } = settings;
    return {
        ...rest,
        endereco: enderecoJson || {},
        redesSociais: redesSociais || {},
    };
};

// OBTER CONFIGURAÇÕES
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await (prisma as any).igrejaConfiguracao.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            settings = await (prisma as any).igrejaConfiguracao.create({
                data: {
                    id: 'default',
                    nomeIgreja: 'Igreja EclesiaMaster',
                }
            });
        }

        res.json(mapToFrontend(settings));
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR CONFIGURAÇÕES
router.put('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const updated = await (prisma as any).igrejaConfiguracao.update({
            where: { id: 'default' },
            data: {
                nomeIgreja: data.nomeIgreja,
                cnpj: data.cnpj,
                denominacao: data.denominacao,
                telefone: data.telefone,
                email: data.email,
                missao: data.missao,
                visao: data.visao,
                valores: data.valores,
                logo: data.logo || null,
                enderecoJson: data.endereco || data.enderecoJson || undefined,
                redesSociais: data.redesSociais || undefined,
            }
        });
        res.json(mapToFrontend(updated));
    } catch (error) {
        next(error);
    }
});

export default router;
