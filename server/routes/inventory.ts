import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { logAudit } from '../utils/audit.ts';

const router = Router();

// LISTAR PATRIMÔNIO
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assets = await (prisma as any).patrimonio.findMany({
            include: { categoria: true, responsavel: true },
            orderBy: { nome: 'asc' }
        });

        const mappedAssets = assets.map((a: any) => ({
            id: a.idPatrimonio,
            code: a.codigoInventario,
            name: a.nome,
            category: a.categoria.nome === 'IMÓVEL' ? 'REAL_ESTATE' :
                a.categoria.nome === 'VEÍCULO' ? 'VEHICLE' :
                    a.categoria.nome === 'EQUIPAMENTO' ? 'EQUIPMENT' : 'FURNITURE',
            purchaseDate: a.dataAquisicao.toISOString().split('T')[0],
            purchaseValue: Number(a.valorAquisicao),
            currentValue: Number(a.valorAquisicao), // Simples por enquanto
            status: a.estadoConservacao === 'Novo' || a.estadoConservacao === 'Bom' ? 'GOOD' :
                a.estadoConservacao === 'Regular' ? 'NEED_REPAIR' : 'DAMAGED'
        }));

        res.json(mappedAssets);
    } catch (error) {
        next(error);
    }
});

// ADICIONAR ITEM AO PATRIMÔNIO
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        // Buscar ou criar categoria
        const category = await (prisma as any).patrimonioCategoria.upsert({
            where: {
                nome: data.category === 'REAL_ESTATE' ? 'IMÓVEL' :
                    data.category === 'VEHICLE' ? 'VEÍCULO' :
                        data.category === 'EQUIPMENT' ? 'EQUIPAMENTO' : 'MÓVEL'
            },
            create: {
                nome: data.category === 'REAL_ESTATE' ? 'IMÓVEL' :
                    data.category === 'VEHICLE' ? 'VEÍCULO' :
                        data.category === 'EQUIPMENT' ? 'EQUIPAMENTO' : 'MÓVEL'
            },
            update: {}
        });

        const newAsset = await (prisma as any).patrimonio.create({
            // ... (keep data block)
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'CREATE',
            entidade: 'ASSET',
            entidadeId: newAsset.idPatrimonio,
            dadosNovos: newAsset,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newAsset);
    } catch (error) {
        next(error);
    }
});

export default router;
