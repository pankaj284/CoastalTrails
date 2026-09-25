import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';
import querystring from 'querystring';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const q = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'listcron',
    cpanel_jsonapi_apiversion: '2'
  });
  const url = `https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${q}`;

  https.get(url, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => console.log('cPanel API 2 listcron:\n', b));
  });
}

main().catch(console.error);
