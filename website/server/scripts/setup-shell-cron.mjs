import { CPanelClient } from './cpanel-client.mjs';
import querystring from 'querystring';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const script = `#!/bin/bash
export PATH="/home2/coastaee/nodejs/bin:/usr/local/bin:/usr/bin:/bin"
export PORT=3456
export NODE_ENV=production

# Check if node index.js is running
if ! pgrep -u coastaee -f "index.js" > /dev/null 2>&1; then
    echo "[$(date -u)] [CRON] Node not running, starting..." >> /home2/coastaee/app/cron.log
    cd /home2/coastaee/app
    /home2/coastaee/nodejs/bin/node index.js >> /home2/coastaee/app/app.log 2>&1 &
else
    echo "[$(date -u)] [CRON] Node is already running" >> /home2/coastaee/app/cron.log
fi
`;

  // Save in /home2/coastaee/run_node.sh
  await cp.saveFile('', 'run_node.sh', script);
  console.log('Saved /home2/coastaee/run_node.sh');

  // Chmod 755
  await cp.uapi('Fileman', 'chmod', {
    dir: '/home2/coastaee',
    file: 'run_node.sh',
    perms: '0755'
  });
  console.log('Chmodded run_node.sh to 0755');

  // Replace cron with /bin/bash /home2/coastaee/run_node.sh
  // First delete old cron (linekey 869005136 or all)
  const delCron = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'remove_line',
    cpanel_jsonapi_apiversion: '2',
    linekey: '869005136'
  });
  await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${delCron}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));

  // Add new cron
  const addCron = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'add_line',
    cpanel_jsonapi_apiversion: '2',
    command: '/bin/bash /home2/coastaee/run_node.sh',
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });
  const addRes = await new Promise(resolve => {
    https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${addCron}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    });
  });
  console.log('Added 1-minute cron:', addRes);
}

main().catch(console.error);
