import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Test background execution syntax
  const testPhp = `<?php
header('Content-Type: application/json');

$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';

// Find nohup or setsid
$whichNohup = trim((string)shell_exec('which nohup 2>&1'));
$whichSetsid = trim((string)shell_exec('which setsid 2>&1'));

// Launch node using standard background redirection
$cmd = "cd $appDir && PATH=/home2/coastaee/nodejs/bin:\$PATH ($nodeBin index.js > $appDir/app.log 2>&1 &) && echo 'LAUNCHED'";
$out = shell_exec($cmd);

// Wait a bit
usleep(500000);

// Check if running on 3456
$sock = @stream_socket_client("tcp://127.0.0.1:3456", $errno, $errstr, 1);
$running = is_resource($sock);
if ($running) fclose($sock);

$log = file_exists("$appDir/app.log") ? file_get_contents("$appDir/app.log") : '';

echo json_encode([
    'which_nohup' => $whichNohup,
    'which_setsid' => $whichSetsid,
    'launch_out' => trim((string)$out),
    'running_on_3456' => $running,
    'app_log' => substr($log, -500)
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_launch.php', testPhp);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_launch.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_launch.php', dir: 'public_html' });
}

main().catch(console.error);
