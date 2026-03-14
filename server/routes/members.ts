import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

// LISTAR MEMBROS
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/members - Iniciando busca...');
        const members = await (prisma as any).membro.findMany({
            orderBy: { nomeCompleto: 'asc' }
        });
        console.log(`✅ Membros encontrados: ${members.length}`);

        // Mapear campos para o frontend se necessário
        const mappedMembers = members.map((m: any) => ({
            id: m.idMembro,
            name: m.nomeCompleto,
            bi: m.bi || m.idMembro.substring(0, 8),
            birthDate: m.dataNascimento,
            gender: m.genero === 'MASCULINO' ? 'M' : 'F',
            maritalStatus: m.estadoCivil === 'SOLTEIRO' ? 'SINGLE' :
                m.estadoCivil === 'CASADO' ? 'MARRIED' :
                    m.estadoCivil === 'DIVORCIADO' ? 'DIVORCED' :
                        m.estadoCivil === 'VIUVO' ? 'WIDOW' : 'SINGLE',
            naturality: m.naturalidade,
            province: m.provincia,
            conversionDate: m.dataConversao,
            status: m.ativo ? 'active' : 'inactive',
            role: m.categoria || 'Membro',
            department: m.ministerio || 'Geral',
            phone: m.telefone,
            email: m.email,
            address: m.endereco,
            photoUrl: m.fotoPerfil,
            employmentStatus: m.situacaoProfissional,
            profession: m.profissao,
            schooling: m.escolaridade,

            fatherless: m.orfaoDePai || false,
            motherless: m.orfaoDeMae || false,
            expectedTithe: Number(m.valorDizimoEsperado) || 0
        }));

        res.json(mappedMembers);
    } catch (error) {
        console.error('❌ Erro ao listar membros:', error);
        next(error);
    }
});

// CRIAR MEMBRO
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        // Tratamento de datas vazias para null
        // Helper para datas seguras
        const parseDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return null;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        const birthDate = parseDate(data.birthDate);
        const conversionDate = parseDate(data.conversionDate);
        const baptismDate = parseDate(data.baptismDate);

        const newMember = await (prisma as any).membro.create({
            data: {
                nomeCompleto: data.name,
                bi: data.bi,
                dataNascimento: birthDate,
                genero: data.gender === 'M' ? 'M' : 'F',
                estadoCivil: data.maritalStatus === 'SINGLE' ? 'SOLTEIRO' :
                    data.maritalStatus === 'MARRIED' ? 'CASADO' :
                        data.maritalStatus === 'DIVORCED' ? 'DIVORCIADO' :
                            data.maritalStatus === 'WIDOW' ? 'VIUVO' : 'SOLTEIRO',
                naturalidade: data.naturality,
                provincia: data.province,
                dataConversao: conversionDate,
                dataBatismo: baptismDate,
                categoria: data.role,
                ministerio: data.department,

                orfaoDePai: data.fatherless || false,
                orfaoDeMae: data.motherless || false,

                telefone: data.phone,
                email: data.email,
                endereco: data.address,
                fotoPerfil: data.photoUrl,
                situacaoProfissional: data.employmentStatus,
                profissao: data.profession,
                escolaridade: data.schooling,
                ativo: data.status === 'active',
                valorDizimoEsperado: data.expectedTithe || 0,
                atualizadoEm: new Date()
            }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'CREATE',
            entidade: 'MEMBER',
            entidadeId: newMember.idMembro,
            dadosNovos: newMember,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newMember);
    } catch (error) {
        console.error('❌ Erro ao criar membro:', error);
        next(error);
    }
});

// ATUALIZAR MEMBRO
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;

    console.log('🔵 PUT /api/members/:id - Recebido');
    console.log('ID:', id);

    try {
        const previousData = await (prisma as any).membro.findUnique({ where: { idMembro: id } });

        // Tratamento de datas vazias para null
        // Helper para datas seguras
        const parseDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return null;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        const birthDate = parseDate(data.birthDate);
        const conversionDate = parseDate(data.conversionDate);
        const baptismDate = parseDate(data.baptismDate);

        const updated = await (prisma as any).membro.update({
            where: { idMembro: id },
            data: {
                nomeCompleto: data.name,
                bi: data.bi,
                dataNascimento: birthDate,
                genero: data.gender === 'M' ? 'M' : 'F',
                estadoCivil: data.maritalStatus === 'SINGLE' ? 'SOLTEIRO' :
                    data.maritalStatus === 'MARRIED' ? 'CASADO' :
                        data.maritalStatus === 'DIVORCED' ? 'DIVORCIADO' :
                            data.maritalStatus === 'WIDOW' ? 'VIUVO' : 'SOLTEIRO',
                naturalidade: data.naturality,
                provincia: data.province,
                dataConversao: conversionDate,
                dataBatismo: baptismDate,
                categoria: data.role,
                ministerio: data.department,

                orfaoDePai: data.fatherless || false,
                orfaoDeMae: data.motherless || false,

                telefone: data.phone,
                email: data.email,
                endereco: data.address,
                fotoPerfil: data.photoUrl,
                situacaoProfissional: data.employmentStatus,
                profissao: data.profession,
                escolaridade: data.schooling,
                ativo: data.status === 'active',
                valorDizimoEsperado: data.expectedTithe || 0,
                atualizadoEm: new Date()
            }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'UPDATE',
            entidade: 'MEMBER',
            entidadeId: id,
            dadosAnteriores: previousData,
            dadosNovos: updated,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        if (data.expectedTithe !== undefined) {
            console.log(`🔵 Atualizando registros PENDENTES para o membro ${id} com novo valor: ${data.expectedTithe}`);
            await (prisma as any).dizimo.updateMany({
                where: {
                    idMembro: id,
                    status: 'PENDENTE'
                },
                data: {
                    valor: data.expectedTithe
                }
            });
        }

        console.log('✅ Membro atualizado com sucesso:', updated.idMembro);
        res.json(updated);
    } catch (error) {
        console.error('❌ Erro ao atualizar membro:', error);
        next(error);
    }
});

// DELETAR MEMBRO
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const previousData = await (prisma as any).membro.findUnique({ where: { idMembro: id } });

        await (prisma as any).membro.delete({
            where: { idMembro: id }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'DELETE',
            entidade: 'MEMBER',
            entidadeId: id,
            dadosAnteriores: previousData,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json({ message: 'Membro removido com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
