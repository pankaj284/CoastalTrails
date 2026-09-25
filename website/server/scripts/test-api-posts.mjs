import https from 'https';

async function testApi(path, method, body, headers = {}) {
  const postBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
  const finalHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    ...headers
  };
  if (postBody) {
    finalHeaders['Content-Type'] = 'application/json';
    finalHeaders['Content-Length'] = Buffer.byteLength(postBody);
  }

  return new Promise((resolve) => {
    const req = https.request('https://coastaltrails.in' + path, {
      method,
      rejectUnauthorized: false,
      headers: finalHeaders
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ path, status: res.statusCode, body: b }));
    });
    if (postBody) req.write(postBody);
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Login via /api/auth/login:');
  const adminLogin = await testApi('/api/auth/login', 'POST', {
    identifier: '+919000000000',
    password: 'admin@123'
  });
  console.log('Admin login status:', adminLogin.status);
  console.log('Admin login body:', adminLogin.body);

  console.log('\nTesting Booking Quote:');
  const quote = await testApi('/api/bookings/quote', 'POST', {
    homestayId: 'gokarna-1',
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
    guests: 2
  });
  console.log('Booking quote status:', quote.status);
  console.log('Booking quote body:', quote.body);
}

run().catch(console.error);
