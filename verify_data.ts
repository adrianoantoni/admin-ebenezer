import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFICANDO DÍZIMOS ---');
    const tithes = await prisma.dizimo.findMany({
        include: { membro: true }
    });

    console.log(`Total de dízimos no banco: ${tithes.length}`);
    
    tithes.forEach(t => {
        console.log(`\nID: ${t.idDizimo}`);
        console.log(`Membro: ${t.membro?.nomeCompleto}`);
        console.log(`Valor: ${t.valor}`);
        console.log(`Status: ${t.status}`);
        console.log(`Data (Pagam): ${t.data.toISOString()}`);
        console.log(`Data Referencia: ${t.dataReferencia.toISOString()}`);
        console.log(`Data Referencia UTC Year: ${t.dataReferencia.getUTCFullYear()}`);
        console.log(`Data Referencia UTC Month: ${t.dataReferencia.getUTCMonth() + 1}`);
    });

    const year = 2026;
    const gte = new Date(Date.UTC(year, 0, 1));
    const lte = new Date(Date.UTC(year, 11, 31));
    
    console.log(`\nFiltro para ${year}:`);
    console.log(`GTE: ${gte.toISOString()}`);
    console.log(`LTE: ${lte.toISOString()}`);
    
    const filtered = await prisma.dizimo.findMany({
        where: {
            dataReferencia: {
                gte,
                lte
            }
        }
    });
    
    console.log(`Dízimos filtrados para ${year}: ${filtered.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
