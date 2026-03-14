import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    details?: any;
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Erro interno do servidor';

    // Handle Prisma Foreign Key Constraint Violations
    if (err.code === 'P2003') {
        statusCode = 409; // Conflict
        const field = err.meta?.field_name || '';

        const fieldMapping: Record<string, string> = {
            'dizimos_id_membro_fkey': 'Dízimos',
            'ofertas_id_membro_fkey': 'Ofertas',
            'livro_emprestimos_id_membro_fkey': 'Empréstimos de Livros',
            'membro_ministerio_id_membro_fkey': 'Ministérios',
            'ministerios_lider_fkey': 'Liderança de Ministério',
            'eventos_responsavel_fkey': 'Responsabilidade de Eventos',
            'patrimonio_idResponsavel_fkey': 'Responsabilidade de Património',
            'presencas_eventos_id_membro_fkey': 'Presenças em Eventos',
            'patrimonio_movimentacoes_id_responsavel_anterior_fkey': 'Histórico de Património',
            'patrimonio_movimentacoes_id_responsavel_novo_fkey': 'Movimentação de Património',
            'dizimos_id_ano_fiscal_fkey': 'Dízimos associados',
            'saidas_id_ano_fiscal_fkey': 'Saídas associadas',
            'presencas_eventos_id_evento_fkey': 'Presenças registradas',
            'livro_emprestimos_id_livro_fkey': 'Empréstimos ativos',
            'escola_presencas_id_turma_fkey': 'Registros de presença escolar'
        };

        const entity = Object.keys(fieldMapping).find(key => field.includes(key));
        const entityName = entity ? fieldMapping[entity] : 'outros registros';

        message = `Não é possível excluir este registro pois existem ${entityName} associados a ele. Remova as associações primeiro.`;
    }

    console.error(`[ERROR] ${statusCode} - ${message}`, err.details || err.meta || '');

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        details: process.env.NODE_ENV === 'development' ? (err.details || err.meta) : undefined
    });
};
