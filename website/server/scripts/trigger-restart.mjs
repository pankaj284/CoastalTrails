import { CPanelClient } from './cpanel-client.mjs';
import querystring from 'querystring';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Schedule one-shot command via cron to restart node immediately
  const restartCmd = '/usr/bin/pkill -9 -u coastaee -f "node index.js" ; sleep 1 ; cd /home2/coastaee/app && /home2/coastaee/nodejs/bin/node index.js >> /home2/coastaee/app/app.log 2>&1 &';
  const cronQ = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'add_line',
    cpanel_jsonapi_apiversion: '2',
    command: restartCmd,
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });

  const res = await new Promise(resolve => {
    https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${cronQ}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(JSON.parse(b)));
    });
  });

  const linekey = res?.cpanelresult?.data?.[0]?.linekey;
  console.log('Scheduled restart cron, linekey:', linekey);

  // Wait 3 seconds for cron or execution
  await new Promise(r => setTimeout(r, 3000));

  // Remove the temporary restart cron
  if (linekey) {
    const rmQ = querystring.stringify({
      cpanel_jsonapi_module: 'Cron',
      cpanel_jsonapi_func: 'remove_line',
      cpanel_jsonapi_apiversion: '2',
      linekey
    });
    await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${rmQ}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));
    console.log('Removed temporary restart cron.');
  }

  // Ensure normal watchdog cron is present
  const runnerCron = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'add_line',
    cpanel_jsonapi_apiversion: '2',
    command: '/bin/bash /home2/coastaee/run_node.sh >/dev/null 2>&1',
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });
  await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${runnerCron}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));
  console.log('Watchdog cron active.');
}

main().catch(console.error);
