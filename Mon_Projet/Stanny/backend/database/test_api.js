const fetch = require('node-fetch');

async function testApi() {
  const baseUrl = 'http://localhost:3000/api';
  
  // First, we need a token. We can use a dummy one or skip auth if the server allows (it probably doesn't)
  // Let's try to register a new user first to get a token
  async function getToken() {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'test' + Date.now() + '@test.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    return data.token;
  }

  try {
    const token = await getToken();
    console.log('Token acquired');

    console.log('Testing POST /clients...');
    const res = await fetch(`${baseUrl}/clients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'API Test Client',
        company: 'API Test Corp',
        email: 'api@test.com',
        phone: '99999999'
      })
    });

    const data = await res.json();
    console.log('API RESPONSE:', data);
  } catch (err) {
    console.error('API TEST FAILED:', err);
  }
}

testApi();
