
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const counts = {
      usuarios: await prisma.usuario.count(),
      membros: await prisma.membro.count(),
      dizimos: await prisma.dizimo.count(),
      ofertas: await prisma.oferta.count(),
      saidas: await prisma.saida.count(),
      anosFiscais: await prisma.anoFiscal.count(),
      ministerios: await prisma.ministerio.count(),
      config: await prisma.igrejaConfiguracao.count(),
      patrimonio: await prisma.patrimonio.count()
    };
    console.log('--- DATABASE DIAGNOSTIC ---');
    console.log('Table Counts:', JSON.stringify(counts, null, 2));

    const allUsers = await prisma.usuario.findMany({
      select: { idUsuario: true, nome: true, email: true, perfil: true }
    });
    console.log('All Users:', JSON.stringify(allUsers, null, 2));
    
    if (counts.dizimos > 0) {
      const sampleDizimos = await prisma.dizimo.findMany({ 
        take: 3, 
        include: { membro: { select: { nomeCompleto: true } } } 
      });
      console.log('Sample Dizimos:', JSON.stringify(sampleDizimos, null, 2));
    }

    const activeYear = await prisma.anoFiscal.findFirst({ where: { ativo: true } });
    console.log('Active Fiscal Year:', activeYear ? activeYear.ano : 'NONE');

  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
