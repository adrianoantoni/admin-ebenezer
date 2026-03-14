import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deletePaidTithes2026() {
    try {
        console.log('🔍 Buscando dízimos pagos de 2026...');

        // Buscar o ano fiscal de 2026
        const fiscalYear2026 = await prisma.anoFiscal.findUnique({
            where: { ano: 2026 }
        });

        if (!fiscalYear2026) {
            console.log('⚠️  Ano fiscal 2026 não encontrado.');
            return;
        }

        // Contar quantos existem
        const count = await prisma.dizimo.count({
            where: {
                idAnoFiscal: fiscalYear2026.idAno,
                status: 'PAGO'
            }
        });

        console.log(`📊 Encontrados ${count} dízimos pagos em 2026`);

        if (count === 0) {
            console.log('✅ Nenhum dízimo para deletar.');
            return;
        }

        // Backup - mostrar alguns exemplos antes de deletar
        const samples = await prisma.dizimo.findMany({
            where: {
                idAnoFiscal: fiscalYear2026.idAno,
                status: 'PAGO'
            },
            take: 5,
            include: {
                membro: true
            }
        });

        console.log('\n📋 Exemplos de dízimos que serão deletados:');
        samples.forEach((d: any) => {
            console.log(`   - ${d.membro?.nomeCompleto || 'N/A'}: ${d.valor} Kz (${new Date(d.data).toLocaleDateString()})`);
        });

        console.log(`\n⚠️  ATENÇÃO: Isso vai deletar ${count} registros PERMANENTEMENTE!`);
        console.log('🚨 Execute este script com o argumento --confirm para prosseguir\n');

        // Verificar se tem argumento --confirm
        const hasConfirm = process.argv.includes('--confirm');

        if (!hasConfirm) {
            console.log('❌ Operação cancelada por segurança.');
            console.log('   Execute: npm run ts-node scripts/delete-2026-tithes.ts -- --confirm');
            return;
        }

        console.log('\n🗑️  Deletando dízimos...');

        // Deletar
        const result = await prisma.dizimo.deleteMany({
            where: {
                idAnoFiscal: fiscalYear2026.idAno,
                status: 'PAGO'
            }
        });

        console.log(`✅ ${result.count} dízimos deletados com sucesso!`);

    } catch (error) {
        console.error('❌ Erro ao deletar dízimos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deletePaidTithes2026();
