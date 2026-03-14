import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Iniciando migração de anos fiscais...');

    try {
        // 1. Buscar todos os dízimos para identificar os anos existentes
        const dizimos = await prisma.dizimo.findMany({
            select: {
                idDizimo: true,
                dataReferencia: true,
            }
        });

        console.log(`📊 Total de dízimos encontrados: ${dizimos.length}`);

        // 2. Extrair anos únicos
        const anosUnicos = new Set<number>();
        dizimos.forEach(d => {
            const ano = d.dataReferencia.getUTCFullYear();
            anosUnicos.add(ano);
        });

        // Adicionar ano atual se não estiver presente
        const currentYear = new Date().getFullYear();
        anosUnicos.add(currentYear);

        console.log(`📅 Anos identificados: ${Array.from(anosUnicos).sort().join(', ')}`);

        // 3. Criar registros de AnoFiscal
        for (const ano of anosUnicos) {
            await prisma.anoFiscal.upsert({
                where: { ano },
                update: {},
                create: {
                    ano,
                    ativo: ano === currentYear,
                    descricao: `Ano Fiscal ${ano}`,
                }
            });
            console.log(`✅ Ano fiscal ${ano} processado.`);
        }

        // 4. Buscar os AnosFiscais criados para mapeamento
        const anosFiscais = await prisma.anoFiscal.findMany();
        const anoMapeamento = new Map<number, string>();
        anosFiscais.forEach(af => {
            anoMapeamento.set(af.ano, af.idAno);
        });

        // 5. Atualizar registros de Dízimo com idAnoFiscal
        let totalUpdated = 0;
        for (const d of dizimos) {
            const ano = d.dataReferencia.getUTCFullYear();
            const idAnoFiscal = anoMapeamento.get(ano);

            if (idAnoFiscal) {
                await prisma.dizimo.update({
                    where: { idDizimo: d.idDizimo },
                    data: { idAnoFiscal }
                });
                totalUpdated++;
            }
        }

        console.log(`🎉 Migração concluída com sucesso! ${totalUpdated} dízimos atualizados.`);

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
