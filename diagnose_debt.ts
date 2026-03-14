
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const members = await prisma.membro.findMany({
        where: { nomeCompleto: { contains: 'Ana Oliveira' } },
        include: { dizimos: true }
    });

    const today = new Date();
    const yearEnd = new Date(Date.UTC(today.getUTCFullYear(), 11, 1, 12, 0, 0));
    const currentYearEnd = yearEnd;

    console.log(`Debug for Year: ${today.getUTCFullYear()}`);
    console.log(`Current Year End: ${currentYearEnd.toISOString()}`);

    for (const m of members) {
        console.log(`\nMembro: ${m.nomeCompleto}`);
        console.log(`Expected Tithe: ${m.valorDizimoEsperado}`);
        console.log(`Join Date (Conversao): ${m.dataConversao}`);
        console.log(`Created At (CriadoEm): ${m.criadoEm}`);

        let startDateRaw = m.dataConversao ? new Date(m.dataConversao) : new Date(m.criadoEm);
        let startDate = new Date(Date.UTC(startDateRaw.getUTCFullYear(), startDateRaw.getUTCMonth(), 1, 12, 0, 0));
        console.log(`Normalized Start Date: ${startDate.toISOString()}`);

        let monthsDiff = (currentYearEnd.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + (currentYearEnd.getUTCMonth() - startDate.getUTCMonth()) + 1;
        console.log(`Total Months (monthsDiff): ${monthsDiff}`);

        const paidMonths = new Set();
        console.log(`Tithe Records (${m.dizimos.length}):`);
        m.dizimos.forEach(d => {
            const dDate = new Date(d.dataReferencia);
            const dDateNorm = new Date(Date.UTC(dDate.getUTCFullYear(), dDate.getUTCMonth(), 1, 12, 0, 0));

            let isMatch = dDateNorm.getTime() <= currentYearEnd.getTime() && dDateNorm.getTime() >= startDate.getTime();
            const key = `${dDateNorm.getUTCFullYear()}-${dDateNorm.getUTCMonth()}`;

            if (isMatch) {
                paidMonths.add(key);
            }
            console.log(`  - Ref: ${d.dataReferencia.toISOString()} | Norm: ${dDateNorm.toISOString()} | Match: ${isMatch} | Key: ${key}`);
        });

        const unpaidCount = monthsDiff - paidMonths.size;
        console.log(`Paid Months (Unique): ${paidMonths.size}`);
        console.log(`Unpaid Count: ${unpaidCount}`);
        console.log(`Calculated Debt: ${unpaidCount * Number(m.valorDizimoEsperado)}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
