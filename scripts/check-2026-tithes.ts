import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllTithes2026() {
    try {
        console.log('🔍 Verificando TODOS os dízimos de 2026...\n');

        // Buscar o ano fiscal de 2026
        const fiscalYear2026 = await prisma.anoFiscal.findUnique({
            where: { ano: 2026 }
        });

        if (!fiscalYear2026) {
            console.log('⚠️  Ano fiscal 2026 não encontrado no banco.');
            return;
        }

        // Contar por status
        const allTithes = await prisma.dizimo.findMany({
            where: {
                idAnoFiscal: fiscalYear2026.idAno
            },
            include: {
                membro: true
            }
        });

        console.log(`📊 Total de dízimos em 2026: ${allTithes.length}\n`);

        if (allTithes.length === 0) {
            console.log('✅ Nenhum dízimo encontrado para 2026.');
            return;
        }

        // Agrupar por status
        const byStatus: Record<string, number> = {};
        allTithes.forEach((d: any) => {
            byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        });

        console.log('📋 Distribuição por status:');
        Object.entries(byStatus).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        // Mostrar alguns exemplos
        console.log('\n📝 Exemplos de dízimos:');
        allTithes.slice(0, 10).forEach((d: any) => {
            console.log(`   - ${d.membro?.nomeCompleto || 'N/A'}: ${d.valor} Kz | Status: ${d.status} | Data: ${new Date(d.data).toLocaleDateString()}`);
        });

        // Verificar se quer deletar TODOS
        const hasConfirm = process.argv.includes('--delete-all');

        if (hasConfirm) {
            console.log(`\n🗑️  Deletando TODOS os ${allTithes.length} dízimos de 2026...`);

            const result = await prisma.dizimo.deleteMany({
                where: {
                    idAnoFiscal: fiscalYear2026.idAno
                }
            });

            console.log(`✅ ${result.count} dízimos deletados com sucesso!`);
        } else {
            console.log('\n💡 Para deletar TODOS os dízimos de 2026 (independente do status):');
            console.log('   npx ts-node scripts/check-2026-tithes.ts --delete-all');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkAllTithes2026();
