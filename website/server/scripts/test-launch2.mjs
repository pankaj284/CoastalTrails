import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Test full path to nohup
  const testPhp = `<?php
header('Content-Type: application/json');

$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';

// Execute node with /usr/bin/nohup
$cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js > $appDir/app.log 2>&1 &";
shell_exec($cmd);

// Wait up to 3 seconds for it to bind
$running = false;
for ($i = 0; $i < 15; $i++) {
    usleep(200000);
    $sock = @stream_socket_client("tcp://127.0.0.1:3456", $errno, $errstr, 0.5);
    if (is_resource($sock)) {
        fclose($sock);
        $running = true;
        break;
    }
}

$log = file_exists("$appDir/app.log") ? file_get_contents("$appDir/app.log") : '';

echo json_encode([
    'running_on_3456' => $running,
    'app_log' => $log
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_launch2.php', testPhp);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_launch2.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_launch2.php', dir: 'public_html' });
}

main().catch(console.error);
