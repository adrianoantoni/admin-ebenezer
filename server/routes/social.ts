import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// LISTAR BENEFICIARIOS
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const beneficiaries = await (prisma as any).beneficiarioSocial.findMany({
            orderBy: { criadoEm: 'desc' }
        });

        // Mapear para o formato do AppContext (SocialBeneficiary)
        const mappedBeneficiaries = beneficiaries.map((b: any) => ({
            id: b.idBeneficiario,
            name: b.nome,
            phone: b.telefone || '',
            needs: b.necessidades,
            lastAidDate: b.dataUltimaAjuda ? b.dataUltimaAjuda.toISOString().split('T')[0] : undefined,
            status: b.status
        }));

        res.json(mappedBeneficiaries);
    } catch (error) {
        next(error);
    }
});

// CRIAR BENEFICIARIO
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, phone, needs, status, lastAidDate } = req.body;

        if (!name || !needs) {
            return res.status(400).json({ message: 'Nome e necessidades são obrigatórios' });
        }

        const safeDate = lastAidDate ? new Date(`${lastAidDate}T12:00:00`) : undefined;

        const newBeneficiary = await (prisma as any).beneficiarioSocial.create({
            data: {
                nome: name,
                telefone: phone || null,
                necessidades: needs,
                status: status || 'ATIVO',
                dataUltimaAjuda: safeDate
            }
        });

        res.status(201).json({
            id: newBeneficiary.idBeneficiario,
            name: newBeneficiary.nome,
            phone: newBeneficiary.telefone || '',
            needs: newBeneficiary.necessidades,
            status: newBeneficiary.status,
            lastAidDate: newBeneficiary.dataUltimaAjuda ? newBeneficiary.dataUltimaAjuda.toISOString().split('T')[0] : undefined
        });
    } catch (error) {
        next(error);
    }
});

// ATUALIZAR BENEFICIARIO
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, phone, needs, status, lastAidDate } = req.body;

        const safeDate = lastAidDate ? new Date(`${lastAidDate}T12:00:00`) : undefined;

        const updated = await (prisma as any).beneficiarioSocial.update({
            where: { idBeneficiario: id },
            data: {
                nome: name,
                telefone: phone || null,
                necessidades: needs,
                status: status,
                dataUltimaAjuda: safeDate
            }
        });

        res.json({
            id: updated.idBeneficiario,
            name: updated.nome,
            phone: updated.telefone || '',
            needs: updated.necessidades,
            status: updated.status,
            lastAidDate: updated.dataUltimaAjuda ? updated.dataUltimaAjuda.toISOString().split('T')[0] : undefined
        });
    } catch (error) {
        next(error);
    }
});

// EXCLUIR BENEFICIARIO
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await (prisma as any).beneficiarioSocial.delete({ where: { idBeneficiario: id } });
        res.json({ message: 'Beneficiário excluído com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
