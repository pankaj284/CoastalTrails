import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  console.log('--- CRON LOG ---');
  try {
    const cronLog = await cp.getFile('app', 'cron.log');
    console.log(cronLog.data.content);
  } catch (e) {
    console.log('No cron.log yet');
  }

  console.log('--- APP LOG (last 15 lines) ---');
  try {
    const appLog = await cp.getFile('app', 'app.log');
    console.log(appLog.data.content.split('\n').slice(-15).join('\n'));
  } catch (e) {
    console.log('No app.log');
  }

  console.log('\n--- TESTING /api/health ---');
  try {
    const res = await new Promise((resolve) => {
      const req = https.get('https://coastaltrails.in/api/health', { rejectUnauthorized: false }, r => {
        let b = '';
        r.on('data', c => b += c);
        r.on('end', () => resolve({ status: r.statusCode, body: b }));
      });
      req.on('error', err => resolve({ error: err.message }));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ error: 'Request timed out after 5s' });
      });
    });
    console.log('Health check result:', res);
  } catch (e) {
    console.log('Health test error:', e.message);
  }
}

main().catch(console.error);
