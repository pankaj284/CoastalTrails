import https from 'https';

function req(options, body) {
  return new Promise(resolve => {
    const r = https.request('https://coastaltrails.in' + options.path, {
      method: options.method || 'GET',
      rejectUnauthorized: false,
      headers: options.headers || {}
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ path: options.path, method: options.method, status: res.statusCode, body: b.substring(0, 100) }));
    });
    if (body) r.write(body);
    r.end();
  });
}

async function run() {
  console.log('1. Empty string body:');
  console.log(await req({ path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, ''));

  console.log('2. Empty object body {}:');
  console.log(await req({ path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, '{}'));

  console.log('3. Simple body {"test":1}:');
  console.log(await req({ path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, '{"test":1}'));
}

run().catch(console.error);
