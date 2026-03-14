async function testLoginAPI() {
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response body:', text);

        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.log('Response is not JSON');
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testLoginAPI();
