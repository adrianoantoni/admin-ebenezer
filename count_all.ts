import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countAll() {
  try {
    console.log('--- VERCEL DATABASE RECORD COUNT ---');
    
    const [
      users,
      members,
      tithes,
      offerings,
      expenses,
      casamentos,
      turmas,
      livros,
      patrimonios,
      logs
    ] = await Promise.all([
      (prisma as any).usuario.count(),
      (prisma as any).membro.count(),
      (prisma as any).dizimo.count(),
      (prisma as any).oferta.count(),
      (prisma as any).saida.count(),
      (prisma as any).casamento.count(),
      (prisma as any).escolaTurma.count(),
      (prisma as any).livro.count(),
      (prisma as any).patrimonio.count(),
      (prisma as any).auditLog.count()
    ]);

    console.log(`Users: ${users}`);
    console.log(`Members: ${members}`);
    console.log(`Tithes: ${tithes}`);
    console.log(`Offerings: ${offerings}`);
    console.log(`Expenses: ${expenses}`);
    console.log(`Marriages: ${casamentos}`);
    console.log(`School Classes: ${turmas}`);
    console.log(`Books: ${livros}`);
    console.log(`Patrimony Items: ${patrimonios}`);
    console.log(`Audit Logs: ${logs}`);

  } catch (error) {
    console.error('Error counting records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countAll();
