import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDebt() {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentYearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    const currentYearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    console.log(`Debug Debt Calculation for Year: ${currentYear}`);
    console.log(`Current Date: ${today.toISOString()}`);

    const members = await prisma.membro.findMany({
      select: {
        idMembro: true,
        nomeCompleto: true,
        valorDizimoEsperado: true,
        ativo: true,
        dataConversao: true,
        criadoEm: true,
        dizimos: {
          select: {
            status: true,
            dataReferencia: true
          }
        }
      }
    });

    console.log(`Found ${members.length} members total in database`);
    members.forEach(m => console.log(`- ${m.nomeCompleto}: Expected Tithe = ${m.valorDizimoEsperado}, Active = ${m.ativo}`));

    let totalDebt = 0;
    let totalDebtors = 0;

    for (const member of members) {
      const expected = Number(member.valorDizimoEsperado) || 0;
      const entranceDate = member.dataConversao ? new Date(member.dataConversao) : new Date(member.criadoEm);
      
      const effectiveStart = entranceDate > currentYearStart ? 
          new Date(Date.UTC(entranceDate.getUTCFullYear(), entranceDate.getUTCMonth(), 1)) : 
          currentYearStart;

      const monthsToDate = (today.getUTCFullYear() - effectiveStart.getUTCFullYear()) * 12 + (today.getUTCMonth() - effectiveStart.getUTCMonth()) + 1;
      const paidCount = member.dizimos.length;
      const unpaidCount = Math.max(0, monthsToDate - paidCount);

      if (unpaidCount > 0) {
        const debt = unpaidCount * expected;
        totalDebt += debt;
        totalDebtors++;
        console.log(`Member: ${member.nomeCompleto} - Expected: ${expected} - Months to Date: ${monthsToDate} - Paid: ${paidCount} - Debt: ${debt}`);
      }
    }

    console.log(`Total Debt: ${totalDebt} Kz`);
    console.log(`Total Debtors: ${totalDebtors}`);

  } catch (error) {
    console.error('Error debugging debt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDebt();
