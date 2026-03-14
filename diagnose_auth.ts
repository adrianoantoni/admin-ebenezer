
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Carregar .env manual (mesma lógica do servidor)
const processEnv: any = {};
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                if (key && value) {
                    processEnv[key.trim()] = value.trim();
                }
            }
        });
        console.log('✅ .env carregado');
    }
} catch (e) { }

const JWT_SECRET = processEnv.JWT_SECRET || 'eclesia-secret-key-2025';
console.log(`Segredo em uso: ${JWT_SECRET === 'eclesia-secret-key-2025' ? 'DEFAULT' : 'ENV_FILE'}`);

const payload = { userId: 'diag-test', role: 'ADMIN' };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log('Token gerado para teste:', token.substring(0, 20) + '...');

jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
        console.error('❌ Falha na verificação local:', err.message);
    } else {
        console.log('✅ Verificação local bem sucedida!');
        console.log('Payload decodificado:', decoded);
    }
});

console.log('\n--- DICA PARA O UTILIZADOR ---');
console.log('Se este teste deu "VERDE", mas o browser dá 403:');
console.log('1. Limpe o LocalStorage do browser.');
console.log('2. Faça Login novamente.');
console.log('3. O backend deve ser reiniciado para ler as novas alterações.');
