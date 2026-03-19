import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAudit() {
  try {
    const logs = await (prisma as any).auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: { usuario: true }
    });

    console.log('--- RECENT AUDIT LOGS ---');
    logs.forEach((log: any) => {
      console.log(`[${log.timestamp.toISOString()}] User: ${log.usuario?.nome} - Action: ${log.acao} - Entity: ${log.entidade} (${log.entidadeId || 'N/A'})`);
    });

    const membersCount = await (prisma as any).membro.count();
    console.log(`\nTotal Members: ${membersCount}`);

    const tithesCount = await (prisma as any).dizimo.count();
    console.log(`Total Tithes: ${tithesCount}`);

  } catch (error) {
    console.error('Error checking audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudit();
