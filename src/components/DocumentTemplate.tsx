import React from 'react';
import { Church } from 'lucide-react';
import { Member, ChurchSettings, Transaction } from '../core/types';

interface DocumentTemplateProps {
    member: Member;
    type: string;
    id?: string;
    churchSettings?: ChurchSettings;
    transactions?: Transaction[];
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({ member, type, id, churchSettings, transactions = [] }) => {
    const churchName = churchSettings?.nomeIgreja || 'Eclesia Master';
    const logo = churchSettings?.logo;
    const denomination = churchSettings?.denominacao || '';

    const docTitle =
        type === 'baptism' ? 'Certificado de Santo Batismo' :
            type === 'member' ? 'Certificado de Membresia' :
                type === 'transfer' ? 'Carta de Transferência' :
                    'Ficha de Cadastro Ministerial';

    const renderContent = () => {
        if (type === 'registration') {
            const memberTithings = transactions.filter(t => t.type === 'TITHES');
            const years = Array.from(new Set(memberTithings.map(t => t.year))).sort((a, b) => b - a);
            const currentYear = new Date().getFullYear();
            if (!years.includes(currentYear)) years.unshift(currentYear);

            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            return (
                <div style={{ textAlign: 'left', width: '100%', fontSize: '12pt', color: '#333' }}>
                    {/* BIOGRAPHY SECTION */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20pt', marginBottom: '20pt', borderBottom: '1px solid #eee', paddingBottom: '15pt' }}>
                        <div>
                            <h3 style={{ fontSize: '13pt', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', marginBottom: '10pt', textTransform: 'uppercase' }}>Dados Pessoais</h3>
                            <p style={{ margin: '4pt 0' }}><strong>Nome:</strong> {member.name}</p>
                            <p style={{ margin: '4pt 0' }}><strong>BI:</strong> {member.bi}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Data Nasc.:</strong> {member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : '___/___/______'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Gênero:</strong> {member.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Estado Civil:</strong> {member.maritalStatus}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Natural:</strong> {member.naturality}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Província:</strong> {member.province}</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '13pt', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', marginBottom: '10pt', textTransform: 'uppercase' }}>Informações Eclesiásticas</h3>
                            <p style={{ margin: '4pt 0' }}><strong>Cargo:</strong> {member.role}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Departamento:</strong> {member.department}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Data Conversão:</strong> {member.conversionDate ? new Date(member.conversionDate).toLocaleDateString('pt-BR') : '___/___/______'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Data Batismo:</strong> {member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : 'Sem Informação'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Status:</strong> {member.status.toUpperCase()}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Profissão:</strong> {member.profession || '__________'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Escolaridade:</strong> {member.schooling || '__________'}</p>
                            <p style={{ margin: '4pt 0' }}><strong>Situação Laboral:</strong> {member.employmentStatus || '__________'}</p>
                            {member.family?.spouse && <p style={{ margin: '4pt 0' }}><strong>Cônjuge:</strong> {member.family.spouse}</p>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20pt' }}>
                        {/* FINANCIAL HISTORY TABLE */}
                        <div>
                            <h3 style={{ fontSize: '13pt', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', marginBottom: '10pt', textTransform: 'uppercase' }}>Histórico de Dízimos</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                                        <th style={{ padding: '6pt', border: '1px solid #ddd' }}>Data</th>
                                        <th style={{ padding: '6pt', border: '1px solid #ddd' }}>Mês/Ano</th>
                                        <th style={{ padding: '6pt', border: '1px solid #ddd' }}>Valor</th>
                                        <th style={{ padding: '6pt', border: '1px solid #ddd' }}>Método</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {memberTithings.length > 0 ? (
                                        memberTithings.slice(0, 8).map(t => (
                                            <tr key={t.id}>
                                                <td style={{ padding: '4pt 6pt', border: '1px solid #ddd' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                                <td style={{ padding: '4pt 6pt', border: '1px solid #ddd' }}>{t.month}/{t.year}</td>
                                                <td style={{ padding: '4pt 6pt', border: '1px solid #ddd' }}>{t.amount.toLocaleString()} Kz</td>
                                                <td style={{ padding: '4pt 6pt', border: '1px solid #ddd' }}>{t.method}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '10pt', textAlign: 'center', border: '1px solid #ddd', fontStyle: 'italic' }}>Nenhum registro encontrado</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {memberTithings.length > 8 && <p style={{ fontSize: '8pt', marginTop: '4pt', fontStyle: 'italic' }}>* Mostrando apenas os últimos 8 lançamentos.</p>}
                        </div>

                        {/* MONTHLY STATUS GRID */}
                        <div>
                            <h3 style={{ fontSize: '13pt', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', marginBottom: '10pt', textTransform: 'uppercase' }}>Resumo de Mensalidades (Quotas)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15pt' }}>
                                {years.slice(0, 2).map(year => {
                                    const paidMonths = memberTithings.filter(t => t.year === year).map(t => t.month);

                                    return (
                                        <div key={year} style={{ backgroundColor: '#fafafa', padding: '10pt', borderRadius: '8pt', border: '1px solid #eee' }}>
                                            <p style={{ margin: '0 0 8pt 0', fontWeight: 'bold', color: '#1e3a8a', fontSize: '11pt' }}>Exercício: {year}</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6pt' }}>
                                                {monthNames.map((mName, idx) => {
                                                    const mNum = idx + 1;
                                                    const isPaid = paidMonths.includes(mNum);
                                                    const isFuture = year === currentYear && mNum > new Date().getMonth() + 1;

                                                    return (
                                                        <div
                                                            key={mName}
                                                            style={{
                                                                fontSize: '9pt',
                                                                padding: '4pt',
                                                                borderRadius: '4pt',
                                                                textAlign: 'center',
                                                                border: '1px solid',
                                                                backgroundColor: isPaid ? '#ecfdf5' : isFuture ? '#f9fafb' : '#fef2f2',
                                                                color: isPaid ? '#065f46' : isFuture ? '#9ca3af' : '#991b1b',
                                                                borderColor: isPaid ? '#a7f3d0' : isFuture ? '#e5e7eb' : '#fecaca',
                                                                fontWeight: isPaid ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {mName.substring(0, 3)}: {isPaid ? 'PAGO' : isFuture ? '---' : 'DÍVIDA'}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ textAlign: 'left', width: '100%', lineHeight: '2.6', fontSize: '14pt' }}>
                <p>
                    Certificamos perante Deus e a Igreja que o(a) irmão(ã){' '}
                    <strong style={{ textDecoration: 'underline' }}>{member.name}</strong>,
                    natural de {member.naturality || 'Angola'}, portador(a) do BI nº{' '}
                    <strong>{member.bi}</strong>, é parte integrante desta congregação.
                </p>

                {type === 'baptism' && (
                    <p style={{ marginTop: '20pt' }}>
                        Foi batizado(a) nas águas em conformidade com as Sagradas Escrituras em{' '}
                        <strong>{member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : '____/____/____'}</strong>.
                    </p>
                )}

                {type === 'transfer' && (
                    <p style={{ marginTop: '20pt' }}>
                        Por meio desta, declaramos que o(a) referido(a) membro está sendo transferido(a) para outra
                        congregação, cessando assim os vínculos com esta instituição religiosa a partir da presente data.
                    </p>
                )}

                <p style={{ marginTop: '40pt' }}>
                    Este documento goza de fé pública no âmbito ministerial desta instituição religiosa.
                </p>
            </div>
        );
    };

    return (
        <div
            id={id}
            style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '12pt',
                background: '#ffffff',
                width: '297mm',
                minHeight: '210mm',
                padding: '15mm 25mm',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                flexShrink: 0,
                color: '#1a1a1a',
                boxSizing: 'border-box',
                border: '10px double #1e3a8a', // Add a nice border for certificates
            }}
        >
            {/* CABEÇALHO: Logo à esquerda, texto centralizado */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24pt',
                borderBottom: '2px solid #1e3a8a',
                paddingBottom: '16pt',
            }}>
                {/* Logo - canto superior esquerdo */}
                <div style={{
                    width: '90px',
                    height: '90px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {logo ? (
                        <img
                            src={logo}
                            alt="Logo da Igreja"
                            style={{
                                width: '90px',
                                height: '90px',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <Church size={60} color="#1e3a8a" />
                    )}
                </div>

                {/* Texto do cabeçalho - centralizado */}
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    paddingRight: '90px', // compensar o logo para manter centralizado
                }}>
                    <h1 style={{
                        fontSize: '18pt',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        margin: 0,
                        color: '#1e3a8a',
                    }}>
                        {churchName}
                    </h1>
                    {denomination && (
                        <p style={{
                            fontSize: '11pt',
                            margin: '4pt 0 0 0',
                            color: '#555',
                            fontStyle: 'italic',
                        }}>
                            {denomination}
                        </p>
                    )}
                    <p style={{
                        fontSize: '10pt',
                        margin: '2pt 0 0 0',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        fontWeight: 'bold',
                    }}>
                        Secretaria-Geral Ministerial
                    </p>
                </div>
            </div>

            {/* TÍTULO DO DOCUMENTO - centralizado */}
            <div style={{
                textAlign: 'center',
                margin: '24pt 0 32pt 0',
            }}>
                <h2 style={{
                    fontSize: '18pt',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    margin: 0,
                    borderBottom: '1px solid #ccc',
                    display: 'inline-block',
                    paddingBottom: '6pt',
                }}>
                    {docTitle}
                </h2>
            </div>

            {/* CONTEÚDO */}
            <div style={{ flex: 1 }}>
                {renderContent()}
            </div>

            {/* ASSINATURAS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '60pt',
                marginTop: '60pt',
                padding: '0 20pt',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '8pt' }}>
                        <p style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
                            Secretário Executivo
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '8pt' }}>
                        <p style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
                            Pastor Presidente
                        </p>
                    </div>
                </div>
            </div>

            {/* RODAPÉ */}
            <div style={{
                textAlign: 'center',
                marginTop: '32pt',
                fontSize: '9pt',
                color: '#999',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
            }}>
                Luanda, Angola — {new Date().toLocaleDateString('pt-BR')}
            </div>
        </div>
    );
};
