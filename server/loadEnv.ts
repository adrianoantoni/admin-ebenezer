// 🌍 Definir timezone de Angola (WAT UTC+1) ANTES de tudo
process.env.TZ = 'Africa/Luanda';

import fs from 'fs';
import path from 'path';

// Carregador manual de .env para funcionamento offline sem dotenv
// Deve ser importado no topo do entry point (index.ts)
try {
    const envPath = path.resolve(process.cwd(), '.env');
    console.log(`🔍 Tentando carregar .env de: ${envPath}`);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        let count = 0;
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                    process.env[key.trim()] = value;
                    count++;
                }
            }
        });
        console.log(`✅ Variáveis de ambiente carregadas: ${count} (Manual Modo Offline)`);
    } else {
        console.log('ℹ️ Ficheiro .env não encontrado. Usando valores padrão.');
    }
} catch (e) {
    console.warn('⚠️ Falha ao carregar .env manual:', e);
}

export const getJwtSecret = () => process.env.JWT_SECRET || 'eclesia-secret-key-2025';
