import fetch from 'node-fetch';

async function diagnoseAPI() {
    const loginUrl = 'http://localhost:3001/api/auth/login';
    const membersUrl = 'http://localhost:3001/api/members';

    const loginPayload = {
        email: 'adriano@test.com',
        password: 'admin123'
    };

    console.log('--- API Diagnosis ---');
    console.log(`Attempting login at ${loginUrl}...`);

    try {
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload)
        });

        if (!loginRes.ok) {
            console.error(`Login failed with status: ${loginRes.status}`);
            const errorData = await loginRes.json();
            console.error('Error detail:', errorData);
            return;
        }

        const { token, user } = await loginRes.json();
        console.log('✅ Login successful!');
        console.log('User:', user);
        console.log('Token (truncated):', token.substring(0, 20) + '...');

        console.log(`Fetching members from ${membersUrl}...`);
        const membersRes = await fetch(membersUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!membersRes.ok) {
            console.error(`Members fetch failed with status: ${membersRes.status}`);
            const errorData = await membersRes.json();
            console.error('Error detail:', errorData);
            return;
        }

        const members = await membersRes.json();
        console.log(`✅ Members fetch successful! Count: ${members.length}`);
        if (members.length > 0) {
            console.log('First member:', members[0]);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

diagnoseAPI();
