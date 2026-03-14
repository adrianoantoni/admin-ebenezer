import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const Perfil = {
    ADMIN: 'ADMIN' as any,
    PASTOR: 'PASTOR' as any,
    TESOUREIRO: 'TESOUREIRO' as any,
    SECRETARIO: 'SECRETARIO' as any,
    MEMBRO: 'MEMBRO' as any
};

async function main() {
    console.log('--- INICIANDO SEED DE ELITE ---');
    const password = await bcrypt.hash('admin123', 10);

    // 1. USUÁRIOS
    console.log('1. Criando usuários...');
    const users = [
        { nome: 'Adriano Domingos', email: 'adriano@test.com', senha: password, perfil: Perfil.ADMIN },
        { nome: 'Pastor Carlos', email: 'carlos@test.com', senha: password, perfil: Perfil.PASTOR },
        { nome: 'Maria Tesoureira', email: 'maria@test.com', senha: password, perfil: Perfil.TESOUREIRO }
    ];

    for (const u of users) {
        await (prisma as any).usuario.upsert({ where: { email: u.email }, update: {}, create: u });
    }

    // 2. MEMBROS
    console.log('2. Criando membros...');
    const member1 = await (prisma as any).membro.create({
        data: {
            nomeCompleto: 'João da Silva',
            email: 'joao@membro.com',
            telefone: '923000111',
            endereco: 'Rua da Fé, Luanda',
            ativo: true,
            atualizadoEm: new Date()
        }
    });

    const member2 = await (prisma as any).membro.create({
        data: {
            nomeCompleto: 'Ana Oliveira',
            email: 'ana@membro.com',
            telefone: '923000222',
            endereco: 'Av. Missionária, Luanda',
            ativo: true,
            atualizadoEm: new Date()
        }
    });

    // 3. MINISTÉRIOS (DEPARTAMENTOS)
    console.log('3. Criando ministérios...');
    await (prisma as any).ministerio.create({
        data: {
            nome: 'Louvor e Adoração',
            descricao: 'Equipe musical da igreja',
            lider: member1.idMembro,
            ativo: true
        }
    });

    // 4. FINANÇAS
    console.log('4. Populando finanças (Dízimos e Ofertas)...');
    await (prisma as any).dizimo.create({
        data: {
            idMembro: member1.idMembro,
            valor: 50000,
            data: new Date(),
            metodoPagamento: 'TRANSFERENCIA',
            observacao: 'Dízimo Mensal'
        }
    });

    await (prisma as any).oferta.create({
        data: {
            idMembro: member2.idMembro,
            valor: 15000,
            tipo: 'CULTO',
            data: new Date(),
            observacao: 'Oferta de Culto de Domingo'
        }
    });

    // 5. CASAMENTOS
    console.log('5. Criando casamentos...');
    await (prisma as any).casamento.create({
        data: {
            nomeNoivo: 'João da Silva',
            noivoMembro: true,
            nomeNoiva: 'Mariana Santos',
            noivaMembro: false,
            data: new Date('2026-06-20'),
            hora: '17:00',
            local: 'Templo Sede',
            celebrante: 'Pastor Carlos',
            status: 'EM_PROCESSO'
        }
    });

    // 6. ESCOLA DOMINICAL
    console.log('6. Criando Escola Dominical...');
    const turma = await (prisma as any).escolaTurma.create({
        data: {
            nome: 'Classe dos Adultos',
            professor: 'Diácono Paulo',
            faixaEtaria: 'Adultos',
            sala: 'Sala 02',
            ativo: true
        }
    });

    await (prisma as any).escolaPresenca.create({
        data: {
            idTurma: turma.idTurma,
            data: new Date(),
            estudantesPresentes: [member1.idMembro, member2.idMembro]
        }
    });

    // 7. BIBLIOTECA
    console.log('7. Criando Biblioteca...');
    const livro = await (prisma as any).livro.create({
        data: {
            titulo: 'A Cabana',
            autor: 'William P. Young',
            categoria: 'Literatura Cristã',
            quantidadeTotal: 5,
            quantidadeDisponivel: 4
        }
    });

    await (prisma as any).livroEmprestimo.create({
        data: {
            idLivro: livro.idLivro,
            idMembro: member2.idMembro,
            dataEmprestimo: new Date(),
            dataDevolucao: new Date('2026-03-01'),
            status: 'ATIVO'
        }
    });

    // 8. PATRIMÔNIO
    console.log('8. Criando Patrimônio...');
    const catPat = await (prisma as any).patrimonioCategoria.upsert({
        where: { nome: 'Equipamentos Eletrônicos' },
        update: {},
        create: { nome: 'Equipamentos Eletrônicos', descricao: 'Equipamentos de áudio, vídeo e informática' }
    });

    await (prisma as any).patrimonio.create({
        data: {
            nome: 'Projetor Laser 4K',
            descricao: 'Projetor ultra-hd para a nave principal',
            idCategoria: catPat.idCategoria,
            codigoInventario: 'PROJ-001',
            valorAquisicao: 120000,
            dataAquisicao: new Date(),
            idResponsavel: member1.idMembro,
            ativo: true,
            localizacao: 'Nave Central'
        }
    });

    console.log('--- SEED DE ELITE FINALIZADO COM SUCESSO ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
