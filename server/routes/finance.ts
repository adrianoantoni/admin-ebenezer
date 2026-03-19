import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

// LISTAR DÍZIMOS
router.get('/tithes', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/finance/tithes - Iniciando busca...');
        const { year } = req.query;
        const where: any = {};
        if (year) {
            where.dataReferencia = {
                gte: new Date(Date.UTC(Number(year), 0, 1)),
                lte: new Date(Date.UTC(Number(year), 11, 31))
            };
        }

        const tithes = await (prisma as any).dizimo.findMany({
            where,
            include: { membro: true },
            orderBy: { data: 'desc' }
        });
        console.log(`✅ Dízimos encontrados: ${tithes.length}`);

        const mappedTithes = tithes.map((t: any) => ({
            id: t.idDizimo,
            date: t.data.toISOString().split('T')[0],
            month: t.dataReferencia.getUTCMonth() + 1,
            year: t.dataReferencia.getUTCFullYear(),
            description: `Dízimo - ${t.membro?.nomeCompleto || 'Membro Desconhecido'}`,
            amount: Number(t.valor),
            type: 'TITHES',
            memberId: t.idMembro,
            memberName: t.membro?.nomeCompleto || 'Desconhecido',
            method: t.metodoPagamento === 'DINHEIRO' ? 'CASH' :
                t.metodoPagamento === 'TRANSFERENCIA' ? 'TRANSFER' : 'CARTAO',
            category: 'Receita',
            status: t.status // PAGO, PENDENTE, ATRASADO
        }));

        res.json(mappedTithes);
    } catch (error) {
        console.error('❌ Erro ao listar dízimos:', error);
        next(error);
    }
});

// REGISTRAR DÍZIMO
router.post('/tithes', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const memberId = data.memberId;
        const paymentDate = new Date(data.date);

        // 1. Validar Mês de Referência (Sequencial)
        // Buscar último dízimo pago
        const lastTithe = await (prisma as any).dizimo.findFirst({
            where: { idMembro: memberId },
            orderBy: { dataReferencia: 'desc' }
        });

        // Criar data de referência em UTC para evitar shifts
        let referenceDate: Date;

        if (data.referenceDate) {
            if (typeof data.referenceDate === 'string' && data.referenceDate.includes('-')) {
                const [y, m, d] = data.referenceDate.split('-').map(Number);
                // Normalizamos para o INÍCIO do dia em UTC (00:00:00)
                referenceDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
            } else {
                const d = new Date(data.referenceDate);
                referenceDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            }
        } else if (data.month && data.year) {
            referenceDate = new Date(Date.UTC(data.year, data.month - 1, 1, 0, 0, 0));
        } else if (lastTithe) {
            const lastRef = new Date(lastTithe.dataReferencia);
            referenceDate = new Date(Date.UTC(lastRef.getUTCFullYear(), lastRef.getUTCMonth() + 1, 1, 0, 0, 0));
        } else {
            // Se for o primeiro, usamos o mês da data de pagamento, mas em UTC
            referenceDate = new Date(Date.UTC(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth(), 1, 0, 0, 0));
        }

        // Validação Rigorosa de Backend:
        if (lastTithe) {
            const lastRef = new Date(lastTithe.dataReferencia);
            const expectedNext = new Date(Date.UTC(lastRef.getUTCFullYear(), lastRef.getUTCMonth() + 1, 1, 12, 0, 0));

            // Comparar timestamps UTC
            if (referenceDate.getTime() > expectedNext.getTime()) {
                return res.status(400).json({
                    error: 'Pagamento fora de ordem',
                    message: `Não é permitido pular meses. O próximo mês a pagar é ${expectedNext.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.`,
                    debug: {
                        receivedDate: referenceDate.toISOString(),
                        expectedNext: expectedNext.toISOString(),
                        lastTitheDate: lastTithe.dataReferencia
                    }
                });
            }
        }

        // Validar se o usuário existe
        let userId = (req as any).user?.userId;
        if (userId) {
            const userExists = await (prisma as any).usuario.findUnique({ where: { idUsuario: userId } });
            if (!userExists) {
                return res.status(401).json({ message: 'Sessão inválida. Por favor, saia e entre novamente.' });
            }
        }

        // 2. Verificar se já existe um registro PENDENTE para este mês/ano
        const pendingTithe = await (prisma as any).dizimo.findFirst({
            where: {
                idMembro: memberId,
                dataReferencia: referenceDate,
                status: 'PENDENTE'
            }
        });

        // 3. Buscar Ano Fiscal Ativo
        let activeFiscalYear = await (prisma as any).anoFiscal.findFirst({
            where: { ativo: true }
        });

        // Se não houver ano ativo, tentar buscar pelo ano da data de referência
        if (!activeFiscalYear) {
            const refYear = referenceDate.getUTCFullYear();
            activeFiscalYear = await (prisma as any).anoFiscal.findUnique({
                where: { ano: refYear }
            });
        }

        let newTithe;

        if (pendingTithe) {
            // Atualizar
            newTithe = await (prisma as any).dizimo.update({
                where: { idDizimo: pendingTithe.idDizimo },
                data: {
                    valor: data.amount,
                    data: paymentDate,
                    metodoPagamento: data.method === 'CASH' ? 'DINHEIRO' :
                        data.method === 'TRANSFER' ? 'TRANSFERENCIA' : 'CARTAO',
                    observacao: data.description,
                    idUsuario: userId,
                    status: 'PAGO',
                    idAnoFiscal: activeFiscalYear?.idAno // Associar ao ano fiscal
                }
            });
        } else {
            // Criar novo PAGO
            newTithe = await (prisma as any).dizimo.create({
                data: {
                    idMembro: data.memberId,
                    valor: data.amount,
                    data: paymentDate,
                    dataReferencia: referenceDate,
                    metodoPagamento: data.method === 'CASH' ? 'DINHEIRO' :
                        data.method === 'TRANSFER' ? 'TRANSFERENCIA' : 'CARTAO',
                    observacao: data.description,
                    idUsuario: userId,
                    status: 'PAGO',
                    idAnoFiscal: activeFiscalYear?.idAno // Associar ao ano fiscal
                }
            });
        }

        // Registrar log de auditoria
        await logAudit({
            usuarioId: userId,
            acao: pendingTithe ? 'UPDATE' : 'CREATE',
            entidade: 'TRANSACTION',
            entidadeId: newTithe.idDizimo,
            dadosNovos: newTithe,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newTithe);
    } catch (error) {
        next(error);
    }
});

// LISTAR OFERTAS
router.get('/offerings', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/finance/offerings - Iniciando busca...');
        const { year } = req.query;
        const where: any = {};
        if (year) {
            where.data = {
                gte: new Date(Date.UTC(Number(year), 0, 1)),
                lte: new Date(Date.UTC(Number(year), 11, 31))
            };
        }

        const offerings = await (prisma as any).oferta.findMany({
            where,
            include: { membro: true },
            orderBy: { data: 'desc' }
        });
        console.log(`✅ Ofertas encontradas: ${offerings.length}`);

        const mappedOfferings = offerings.map((o: any) => ({
            id: o.idOferta,
            date: o.data.toISOString().split('T')[0],
            month: o.data.getUTCMonth() + 1,
            year: o.data.getUTCFullYear(),
            description: `Oferta - ${o.tipo} (${o.observacao || 'Sem obs'})`,
            amount: Number(o.valor),
            type: 'OFFERING',
            memberId: o.idMembro,
            memberName: o.membro?.nomeCompleto || 'Anónimo',
            method: 'CASH', // Default
            category: 'Receita'
        }));

        res.json(mappedOfferings);
    } catch (error) {
        console.error('❌ Erro ao listar ofertas:', error);
        next(error);
    }
});

// REGISTRAR OFERTA
router.post('/offerings', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        console.log('🔵 POST /api/finance/offerings - Payload:', data);

        // Validar usuário
        let userId = (req as any).user?.userId;
        if (userId) {
            const userExists = await (prisma as any).usuario.findUnique({ where: { idUsuario: userId } });
            if (!userExists) {
                return res.status(401).json({ message: 'Sessão inválida. Por favor, saia e entre novamente.' });
            }
        }

        // Mapeamento de Tipo de Oferta (Enum Prisma: CULTO, EVENTO, MISSOES, OUTROS)
        const rawType = (data.category || data.type || 'Geral').toUpperCase();
        let tipoFinal: 'CULTO' | 'EVENTO' | 'MISSOES' | 'OUTROS' = 'CULTO';

        if (rawType.includes('MISS')) {
            tipoFinal = 'MISSOES';
        } else if (rawType.includes('EVEN')) {
            tipoFinal = 'EVENTO';
        } else if (rawType.includes('OUTR')) {
            tipoFinal = 'OUTROS';
        } else {
            tipoFinal = 'CULTO';
        }

        console.log(`🟡 Mapeamento de Oferta: ${rawType} -> ${tipoFinal}`);

        const newOffering = await (prisma as any).oferta.create({
            data: {
                tipo: tipoFinal,
                valor: data.amount,
                data: data.date ? new Date(data.date) : new Date(),
                observacao: data.description || data.category,
                idMembro: data.memberId || null,
                idUsuario: userId
            }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: userId,
            acao: 'CREATE',
            entidade: 'TRANSACTION',
            entidadeId: newOffering.idOferta,
            dadosNovos: newOffering,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(newOffering);
    } catch (error) {
        next(error);
    }
});

// =====================================================
// SAÍDAS (DESPESAS/EXPENSES)
// =====================================================

// LISTAR SAÍDAS
router.get('/expenses', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/finance/expenses - Iniciando busca...');
        const { year } = req.query;
        const where: any = {};
        if (year) {
            where.data = {
                gte: new Date(Date.UTC(Number(year), 0, 1)),
                lte: new Date(Date.UTC(Number(year), 11, 31))
            };
        }

        const expenses = await (prisma as any).saida.findMany({
            where,
            include: { usuario: true },
            orderBy: { data: 'desc' }
        });
        console.log(`✅ Saídas encontradas: ${expenses.length}`);

        const mappedExpenses = expenses.map((e: any) => ({
            id: e.idSaida,
            date: e.data.toISOString().split('T')[0],
            month: e.data.getUTCMonth() + 1,
            year: e.data.getUTCFullYear(),
            description: e.observacao || `Saída - ${e.categoria}`,
            amount: Number(e.valor),
            type: 'EXPENSE',
            method: e.metodoPagamento === 'DINHEIRO' ? 'CASH' :
                e.metodoPagamento === 'TRANSFERENCIA' ? 'TRANSFER' : 'CARTAO',
            category: e.categoria,
            userName: e.usuario?.nome || 'Sistema'
        }));

        res.json(mappedExpenses);
    } catch (error) {
        console.error('❌ Erro ao listar saídas:', error);
        next(error);
    }
});

// REGISTRAR SAÍDA
router.post('/expenses', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        // Validar usuário
        let userId = (req as any).user?.userId;
        if (userId) {
            const userExists = await (prisma as any).usuario.findUnique({ where: { idUsuario: userId } });
            if (!userExists) {
                return res.status(401).json({ message: 'Sessão inválida. Por favor, saia e entre novamente.' });
            }
        }

        // Buscar ano fiscal ativo
        let activeFiscalYear = await (prisma as any).anoFiscal.findFirst({
            where: { ativo: true }
        });

        // Se não houver ano ativo, buscar pelo ano da data
        if (!activeFiscalYear) {
            const expenseDate = new Date(data.date);
            const refYear = expenseDate.getUTCFullYear();
            activeFiscalYear = await (prisma as any).anoFiscal.findUnique({
                where: { ano: refYear }
            });
        }

        const newExpense = await (prisma as any).saida.create({
            data: {
                valor: data.amount,
                categoria: data.category,
                data: data.date ? new Date(data.date) : new Date(),
                metodoPagamento: data.method === 'CASH' ? 'DINHEIRO' :
                    data.method === 'TRANSFER' ? 'TRANSFERENCIA' : 'CARTAO',
                observacao: data.description,
                idUsuario: userId,
                idAnoFiscal: activeFiscalYear?.idAno
            }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: userId,
            acao: 'CREATE',
            entidade: 'TRANSACTION',
            entidadeId: newExpense.idSaida,
            dadosNovos: newExpense,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        console.log('✅ Saída registrada:', newExpense);
        res.status(201).json(newExpense);
    } catch (error) {
        console.error('❌ Erro ao registrar saída:', error);
        next(error);
    }
});

// ATUALIZAR SAÍDA
router.put('/expenses/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = await (prisma as any).saida.update({
            where: { idSaida: id },
            data: {
                valor: data.amount,
                categoria: data.category,
                metodoPagamento: data.method === 'CASH' ? 'DINHEIRO' :
                    data.method === 'TRANSFER' ? 'TRANSFERENCIA' : 'CARTAO',
                observacao: data.description
            }
        });
        res.json(updated);
    } catch (error) {
        console.error('❌ Erro ao atualizar saída:', error);
        next(error);
    }
});

// DELETAR SAÍDA
router.delete('/expenses/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        await (prisma as any).saida.delete({
            where: { idSaida: id }
        });
        res.json({ message: 'Saída removida com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar saída:', error);
        next(error);
    }
});

// GERAR CARNÊ DO ANO (Registros Pendentes)

router.post('/tithes/generate', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { year } = req.body;
        const targetYear = Number(year) || new Date().getFullYear();

        console.log(`🔵 Gerando carnê para o ano ${targetYear}...`);

        // Buscar ou criar o ano fiscal correspondente
        let anoFiscal = await (prisma as any).anoFiscal.findUnique({
            where: { ano: targetYear }
        });

        if (!anoFiscal) {
            anoFiscal = await (prisma as any).anoFiscal.create({
                data: {
                    ano: targetYear,
                    ativo: false,
                    descricao: `Ano Fiscal ${targetYear}`
                }
            });
        }

        // Buscar membros ativos elegíveis
        const members = await (prisma as any).membro.findMany({
            where: {
                ativo: true,
                valorDizimoEsperado: { gt: 0 }
            }
        });

        let createdCount = 0;

        for (const member of members) {
            for (let month = 0; month < 12; month++) {
                const referenceDate = new Date(Date.UTC(targetYear, month, 1, 12, 0, 0));

                const exists = await (prisma as any).dizimo.findFirst({
                    where: {
                        idMembro: member.idMembro,
                        dataReferencia: referenceDate
                    }
                });

                if (!exists) {
                    await (prisma as any).dizimo.create({
                        data: {
                            idMembro: member.idMembro,
                            valor: member.valorDizimoEsperado,
                            data: new Date(),
                            dataReferencia: referenceDate,
                            metodoPagamento: 'DINHEIRO',
                            status: 'PENDENTE',
                            observacao: 'Carnê Anual Gerado Automaticamente',
                            idAnoFiscal: anoFiscal.idAno
                        }
                    });
                    createdCount++;
                }
            }
        }

        console.log(`✅ Carnê gerado: ${createdCount} registros.`);

        res.json({
            message: 'Carnê anual gerado com sucesso.',
            details: `Foram criados ${createdCount} registros pendentes para ${members.length} membros.`
        });

    } catch (error) {
        console.error('❌ Erro ao gerar carnê:', error);
        next(error);
    }
});



// GERAR CARNÊ INDIVIDUAL (Para um membro específico)
router.post('/tithes/generate-member', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { year, memberId } = req.body;
        const targetYear = Number(year) || new Date().getFullYear();

        console.log(`🔵 Gerando carnê para membro ${memberId} - Ano ${targetYear}...`);

        if (!memberId) {
            return res.status(400).json({ message: 'ID do membro é obrigatório.' });
        }

        // Buscar ou criar o ano fiscal
        let anoFiscal = await (prisma as any).anoFiscal.findUnique({
            where: { ano: targetYear }
        });

        if (!anoFiscal) {
            anoFiscal = await (prisma as any).anoFiscal.create({
                data: {
                    ano: targetYear,
                    ativo: false,
                    descricao: `Ano Fiscal ${targetYear}`
                }
            });
        }

        const member = await (prisma as any).membro.findUnique({
            where: { idMembro: memberId }
        });

        if (!member) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }

        let createdCount = 0;

        for (let month = 0; month < 12; month++) {
            const referenceDate = new Date(Date.UTC(targetYear, month, 1, 12, 0, 0));

            const exists = await (prisma as any).dizimo.findFirst({
                where: {
                    idMembro: member.idMembro,
                    dataReferencia: referenceDate
                }
            });

            if (!exists) {
                await (prisma as any).dizimo.create({
                    data: {
                        idMembro: member.idMembro,
                        valor: member.valorDizimoEsperado,
                        data: new Date(),
                        dataReferencia: referenceDate,
                        metodoPagamento: 'DINHEIRO',
                        status: 'PENDENTE',
                        observacao: 'Carnê Individual Gerado',
                        idAnoFiscal: anoFiscal.idAno
                    }
                });
                createdCount++;
            }
        }

        res.json({
            message: 'Carnê individual gerado com sucesso.',
            createdCount
        });

    } catch (error) {
        console.error('❌ Erro ao gerar carnê individual:', error);
        next(error);
    }
});

// CALCULAR DÍVIDA TOTAL
router.get('/stats/debt', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔵 GET /api/finance/stats/debt - Calculando dívida...');

        const today = new Date();
        const currentYearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1, 0, 0, 0));
        const currentYearEnd = new Date(Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59));

        // 1. Buscar membros devedores potenciais (Trabalhadores e Negócios)
        const members = await (prisma as any).membro.findMany({
            where: {
                ativo: true,
                valorDizimoEsperado: { gt: 0 },
                situacaoProfissional: {
                    in: ['TRABALHADOR', 'NEGOCIO']
                }
            },
            select: {
                idMembro: true,
                nomeCompleto: true,
                valorDizimoEsperado: true,
                dataConversao: true,
                criadoEm: true,
                dizimos: {
                    select: {
                        dataReferencia: true,
                        status: true
                    }
                }
            }
        });

        let totalDebt = 0;
        let totalDebtors = 0;

        for (const member of members) {
            const expected = Number(member.valorDizimoEsperado) || 0;
            
            // Determinar quantos meses o membro deveria ter pago este ano
            // (Assumindo compromisso desde o início do ano ou desde a entrada)
            const entranceDate = member.dataConversao ? new Date(member.dataConversao) : new Date(member.criadoEm);
            const effectiveStart = entranceDate > currentYearStart ? 
                new Date(Date.UTC(entranceDate.getUTCFullYear(), entranceDate.getUTCMonth(), 1)) : 
                currentYearStart;

            // Meses até hoje
            const monthsToDate = (today.getUTCFullYear() - effectiveStart.getUTCFullYear()) * 12 + (today.getUTCMonth() - effectiveStart.getUTCMonth()) + 1;
            
            // Calcular dízimos não pagos para o ANO INTEIRO
            let unpaidCount = 0;
            const todayISO = today.toISOString().substring(0, 7); // "YYYY-MM"
            const effectiveStartISO = effectiveStart.toISOString().substring(0, 7);

            for (let m = 0; m < 12; m++) {
                const checkDate = new Date(Date.UTC(today.getUTCFullYear(), m, 1));
                const checkDateISO = checkDate.toISOString().substring(0, 7);
                
                const record = member.dizimos.find((t: any) => {
                    const refISO = new Date(t.dataReferencia).toISOString().substring(0, 7);
                    return refISO === checkDateISO;
                });

                if (!record) {
                    // O usuário deseja que conte como dívida para o ANO INTEIRO (12 meses)
                    // se o dízimo ainda não foi registrado nem pago.
                    if (checkDateISO < effectiveStartISO) continue;
                    
                    unpaidCount++;
                } else if (record.status !== 'PAGO' && record.status !== 'ISENTO') {
                    // Se HÁ registo e não está verde, é dívida!
                    unpaidCount++;
                }
            }

            if (unpaidCount > 0) {
                totalDebt += unpaidCount * expected;
                totalDebtors++;
            }
        }

        console.log(`✅ Dívida Calculada: ${totalDebt} Kz (${totalDebtors} membros)`);

        // Return debug info
        res.json({
            totalDebt,
            totalDebtors,
            debug: {
                found: members.length,
                calculated: totalDebt
            }
        });

    } catch (error) {
        console.error('❌ Erro ao calcular dívida:', error);
        next(error);
    }
});

// ATUALIZAR DÍZIMO (Corrigir valor ou data)
router.put('/tithes/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = await (prisma as any).dizimo.update({
            where: { idDizimo: id },
            data: {
                valor: data.amount,
                metodoPagamento: data.method === 'CASH' ? 'DINHEIRO' :
                    data.method === 'TRANSFER' ? 'TRANSFERENCIA' : 'CARTAO',
                observacao: data.description
            }
        });
        res.json(updated);
    } catch (error) {
        console.error('❌ Erro ao atualizar dízimo:', error);
        next(error);
    }
});

// ANULAR DÍZIMO (Remover lançamento)
router.delete('/tithes/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const tithe = await (prisma as any).dizimo.findUnique({
            where: { idDizimo: id }
        });

        if (!tithe) {
            return res.status(404).json({ message: 'Lançamento não encontrado' });
        }

        const laterTithe = await (prisma as any).dizimo.findFirst({
            where: {
                idMembro: tithe.idMembro,
                dataReferencia: { gt: tithe.dataReferencia },
                status: 'PAGO'
            }
        });

        if (laterTithe) {
            const laterDate = new Date(laterTithe.dataReferencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            return res.status(400).json({
                error: 'Violação de Cronologia',
                message: `Não é possível anular este dízimo pois o mês de ${laterDate} já está pago. Anule primeiro os meses posteriores.`
            });
        }

        // Se faz parte de um carnê (Ano Fiscal), voltamos para PENDENTE
        if (tithe.idAnoFiscal) {
            const updated = await (prisma as any).dizimo.update({
                where: { idDizimo: id },
                data: {
                    status: 'PENDENTE',
                    data: new Date(),
                    metodoPagamento: 'DINHEIRO',
                    observacao: 'Lançamento anulado (revertido para pendente)',
                    idUsuario: null
                },
                include: { membro: true }
            });

            // Registrar log de auditoria
            await logAudit({
                usuarioId: (req as any).user.userId,
                acao: 'ANNUL',
                entidade: 'TRANSACTION',
                entidadeId: id,
                dadosAnteriores: tithe,
                dadosNovos: updated,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            const mapped = {
                id: updated.idDizimo,
                date: updated.data.toISOString().split('T')[0],
                month: updated.dataReferencia.getUTCMonth() + 1,
                year: updated.dataReferencia.getUTCFullYear(),
                description: `Dízimo - ${(updated as any).membro?.nomeCompleto || 'Membro Desconhecido'}`,
                amount: Number(updated.valor),
                type: 'TITHES',
                memberId: updated.idMembro,
                memberName: (updated as any).membro?.nomeCompleto || 'Desconhecido',
                method: updated.metodoPagamento === 'DINHEIRO' ? 'CASH' :
                    updated.metodoPagamento === 'TRANSFERENCIA' ? 'TRANSFER' : 'CARD',
                category: 'Dízimo',
                status: updated.status
            };

            return res.json({
                message: 'Lançamento anulado com sucesso (revertido para pendente)',
                reverted: mapped
            });
        }

        await (prisma as any).dizimo.delete({
            where: { idDizimo: id }
        });

        // Registrar log de auditoria
        await logAudit({
            usuarioId: (req as any).user.userId,
            acao: 'DELETE',
            entidade: 'TRANSACTION',
            entidadeId: id,
            dadosAnteriores: tithe,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json({ message: 'Lançamento removido com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao anular dízimo:', error);
        next(error);
    }
});

export default router;
