import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMember() {
  try {
    const member = await prisma.membro.findFirst({
        where: { nomeCompleto: { contains: 'Adriano' } },
        include: { dizimos: true }
    });

    if (member) {
        console.log('--- MEMBER DETAILS ---');
        console.log(`Name: ${member.nomeCompleto}`);
        console.log(`Created At: ${member.criadoEm.toISOString()}`);
        console.log(`Conversion Date: ${member.dataConversao?.toISOString()}`);
        console.log(`Expected Tithe: ${member.valorDizimoEsperado}`);
        console.log(`Tithes Paid: ${member.dizimos.length}`);
        member.dizimos.forEach(d => {
            console.log(`- Date: ${d.data.toISOString()}, Ref Date: ${d.dataReferencia.toISOString()}, Status: ${d.status}`);
        });
    } else {
        console.log('Member not found');
    }

  } catch (error) {
    console.error('Error checking member:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMember();
