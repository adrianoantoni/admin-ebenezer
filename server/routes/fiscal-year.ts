import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// LISTAR TODOS OS ANOS FISCAIS
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/fiscal-years - Listando anos...');
        const anos = await (prisma as any).anoFiscal.findMany({
            orderBy: { ano: 'desc' }
        });
        console.log(`✅ Anos encontrados: ${anos.length}`);
        res.json(anos);
    } catch (error) {
        console.error('❌ Erro ao listar anos fiscais:', error);
        next(error);
    }
});

// OBTER ANO FISCAL ATIVO
router.get('/active', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anoAtivo = await (prisma as any).anoFiscal.findFirst({
            where: { ativo: true }
        });

        if (!anoAtivo) {
            // Se não houver ano ativo, criar e ativar o ano atual
            const currentYear = new Date().getFullYear();
            const novoAno = await (prisma as any).anoFiscal.create({
                data: {
                    ano: currentYear,
                    ativo: true,
                    descricao: `Ano Fiscal ${currentYear}`
                }
            });
            return res.json(novoAno);
        }

        res.json(anoAtivo);
    } catch (error) {
        console.error('❌ Erro ao buscar ano ativo:', error);
        next(error);
    }
});

// CRIAR NOVO ANO FISCAL
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ano, descricao, ativar } = req.body;

        if (!ano) {
            return res.status(400).json({ message: 'Ano é obrigatório' });
        }

        // Verificar se o ano já existe
        const anoExistente = await (prisma as any).anoFiscal.findUnique({
            where: { ano: Number(ano) }
        });

        if (anoExistente) {
            return res.status(400).json({ message: `Ano ${ano} já existe` });
        }

        // Se ativar = true, desativar todos os outros anos
        if (ativar) {
            await (prisma as any).anoFiscal.updateMany({
                where: { ativo: true },
                data: { ativo: false }
            });
        }

        const novoAno = await (prisma as any).anoFiscal.create({
            data: {
                ano: Number(ano),
                descricao: descricao || `Ano Fiscal ${ano}`,
                ativo: ativar || false
            }
        });

        res.status(201).json(novoAno);
    } catch (error) {
        console.error('❌ Erro ao criar ano fiscal:', error);
        next(error);
    }
});

// ATIVAR UM ANO FISCAL (desativa os outros)
router.put('/:id/activate', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Desativar todos os anos
        await (prisma as any).anoFiscal.updateMany({
            where: { ativo: true },
            data: { ativo: false }
        });

        // Ativar o ano selecionado
        const anoAtivado = await (prisma as any).anoFiscal.update({
            where: { idAno: id },
            data: { ativo: true }
        });

        res.json(anoAtivado);
    } catch (error) {
        console.error('❌ Erro ao ativar ano fiscal:', error);
        next(error);
    }
});

// DELETAR ANO FISCAL (apenas se não tiver registros associados)
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Verificar se há dízimos associados
        const dizimosCount = await (prisma as any).dizimo.count({
            where: { idAnoFiscal: id }
        });

        if (dizimosCount > 0) {
            return res.status(400).json({
                message: `Não é possível deletar este ano fiscal. Existem ${dizimosCount} registros de dízimos associados.`
            });
        }

        await (prisma as any).anoFiscal.delete({
            where: { idAno: id }
        });

        res.json({ message: 'Ano fiscal deletado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar ano fiscal:', error);
        next(error);
    }
});

export default router;
