import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendResetPasswordEmail = async (email: string, token: string, origin?: string) => {
    const baseUrl = origin || process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const mailOptions = {
        from: `"Equipe Igreja Baptista da Sapú" <${process.env.SMTP_FROM || 'noreply@baptistasapu.com'}>`,
        to: email,
        subject: 'Recuperação de Senha - Igreja Baptista da Sapú',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #1e3a8a; text-align: center;">Igreja Baptista da Sapú</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta na Igreja Baptista da Sapú.</p>
        <p>Para prosseguir com a redefinição, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Minha Senha</a>
        </div>
        <p>Este link é válido por 1 hora. Se você não solicitou a alteração, pode ignorar este e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          Este é um e-mail automático, por favor não responda.
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail de recuperação enviado para: ${email}`);
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail para ${email}:`, error);
        throw new Error('Falha ao enviar e-mail de recuperação.');
    }
};
