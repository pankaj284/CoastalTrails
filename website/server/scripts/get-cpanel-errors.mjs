import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const url = `https://${cp.host}:2083${cp.secToken}/frontend/jupiter/stats/errlog.html`;
  https.get(url, {
    rejectUnauthorized: false,
    headers: { Cookie: cp.cookie }
  }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const m = b.match(/<textarea id="error_log-errors"[^>]*>([\s\S]*?)<\/textarea>/i);
      if (m) {
        console.log('--- RAW CPANEL ERROR LOG ---');
        console.log(m[1].split('\n').slice(-30).join('\n'));
      }
    });
  });
}

main().catch(console.error);
