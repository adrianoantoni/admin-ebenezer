import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eclesia-secret-key-2025';
const CLASS_ID = '4ecdbb38-b8ad-4f03-8715-fff10c7bcb21';
const MEMBER_ID = 'fedf1a23-9957-4653-a9bd-836719ea79f2';

async function main() {
    const token = jwt.sign(
        { userId: 'test-admin-id', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('Testing DELETE request...');
    const response = await fetch(`http://localhost:3001/api/school/classes/${CLASS_ID}/students/${MEMBER_ID}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        console.log('✅ DELETE successful');
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } else {
        console.error('❌ DELETE failed');
        console.error('Status:', response.status);
        console.error('Body:', await response.text());
    }
}

main().catch(console.error);
