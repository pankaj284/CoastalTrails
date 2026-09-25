import { CPanelClient } from './cpanel-client.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged into cPanel.');

  // 1. Upload updated routes/homestays.js
  const homestaysRouteContent = fs.readFileSync(path.resolve('./routes/homestays.js'), 'utf-8');
  await cp.saveFile('app/routes', 'homestays.js', homestaysRouteContent);
  console.log('1. Uploaded updated app/routes/homestays.js with cascade delete.');

  // 2. Kill current node on 3457 so it restarts with updated route code
  // The cron job or direct trigger will immediately start it
  const restartPhp = `<?php
shell_exec('/usr/bin/pkill -9 -u coastaee -f "node index.js" 2>/dev/null');
usleep(200000);
shell_exec('cd /home2/coastaee/app && /usr/bin/nohup /home2/coastaee/nodejs/bin/node index.js >> /home2/coastaee/app/app.log 2>&1 &');
for ($i = 0; $i < 10; $i++) {
    usleep(200000);
    $sock = @stream_socket_client("tcp://127.0.0.1:3457", $errno, $errstr, 0.3);
    if ($sock) { fclose($sock); break; }
}
echo "Restarted node on 3457";
`;
  await cp.saveFile('app', 'restart.php', restartPhp);
  console.log('2. Uploaded restart.php.');

  // Also trigger restart via supervisor or cron
  // Let cron or run_node.sh restart it cleanly
  const runCron = await cp.getFile('app', 'restart.php');
  console.log('Verified restart script on server.');
}

main().catch(console.error);
