import express from 'express';
const { Router } = express;
import type { Request, Response, NextFunction } from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// LISTAR LIVROS
router.get('/books', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const books = await (prisma as any).livro.findMany({
            include: {
                emprestimos: {
                    where: { status: 'ATIVO' },
                    include: { membro: true }
                }
            },
            orderBy: { titulo: 'asc' }
        });

        const mapped = books.map((b: any) => ({
            id: b.idLivro,
            title: b.titulo,
            author: b.autor,
            category: b.categoria,
            totalQuantity: b.quantidadeTotal,
            availableQuantity: b.quantidadeDisponivel,
            borrowers: b.emprestimos.map((e: any) => ({
                memberId: e.idMembro,
                memberName: e.membro.nomeCompleto,
                loanDate: e.dataEmprestimo.toISOString(),
                dueDate: e.dataDevolucao ? e.dataDevolucao.toISOString() : null
            }))
        }));

        res.json(mapped);
    } catch (error) {
        next(error);
    }
});

// ADICIONAR LIVRO
router.post('/books', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const newBook = await (prisma as any).livro.create({
            data: {
                titulo: data.title,
                autor: data.author,
                categoria: data.category,
                quantidadeTotal: data.quantity || data.totalQuantity || 1,
                quantidadeDisponivel: data.quantity || data.totalQuantity || 1
            }
        });
        res.status(201).json(newBook);
    } catch (error) {
        next(error);
    }
});

// REGISTRAR EMPRÉSTIMO
router.post('/loans', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    try {
        const loan = await (prisma as any).livroEmprestimo.create({
            data: {
                idLivro: data.bookId,
                idMembro: data.memberId,
                dataDevolucao: new Date(data.dueDate),
                status: 'ATIVO'
            }
        });

        // Atualizar disponibilidade
        await (prisma as any).livro.update({
            where: { idLivro: data.bookId },
            data: { quantidadeDisponivel: { decrement: 1 } }
        });

        res.status(201).json(loan);
    } catch (error) {
        next(error);
    }
});

// REGISTRAR DEVOLUÇÃO
router.post('/returns', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    const { bookId, memberId } = req.body;
    try {
        const loan = await (prisma as any).livroEmprestimo.findFirst({
            where: { idLivro: bookId, idMembro: memberId, status: 'ATIVO' }
        });

        if (!loan) return res.status(404).json({ message: 'Empréstimo não encontrado' });

        await (prisma as any).livroEmprestimo.update({
            where: { idEmprestimo: loan.idEmprestimo },
            data: { status: 'DEVOLVIDO', dataDevolucao: new Date() }
        });

        await (prisma as any).livro.update({
            where: { idLivro: bookId },
            data: { quantidadeDisponivel: { increment: 1 } }
        });

        res.json({ message: 'Livro devolvido com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
