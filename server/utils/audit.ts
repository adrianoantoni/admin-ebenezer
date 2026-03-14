import prisma from '../db.js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'EXPORT' | 'ANNUL';
export type AuditEntity = 'USER' | 'MEMBER' | 'TRANSACTION' | 'ASSET' | 'MARRIAGE' | 'EVENT' | 'SETTING' | 'SCHOOL_CLASS' | 'CELL';

interface AuditLogParams {
    usuarioId: string;
    acao: AuditAction;
    entidade: AuditEntity;
    entidadeId?: string;
    dadosAnteriores?: any;
    dadosNovos?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
}

export const logAudit = async (params: AuditLogParams) => {
    try {
        await (prisma as any).auditLog.create({
            data: {
                usuarioId: params.usuarioId,
                acao: params.acao,
                entidade: params.entidade,
                entidadeId: params.entidadeId,
                dadosAnteriores: params.dadosAnteriores || undefined,
                dadosNovos: params.dadosNovos || undefined,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                status: params.status || 'SUCCESS'
            }
        });
    } catch (error) {
        console.error('❌ Erro ao registrar log de auditoria:', error);
    }
};
