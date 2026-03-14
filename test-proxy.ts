async function testProxyLogin() {
    try {
        console.log('Testing login via Vite proxy (port 3000)...');
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
        });

        console.log('Status:', response.status);
        const text = await response.text();

        if (response.ok) {
            console.log('Success! Response received.');
            try {
                const json = JSON.parse(text);
                console.log('User:', json.user.name);
            } catch (e) {
                console.log('Response is not valid JSON despite 200 status');
            }
        } else {
            console.log('Error response body:', text.substring(0, 100) + '...');
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testProxyLogin();
