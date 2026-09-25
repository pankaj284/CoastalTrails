import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const script = `<?php
header('Content-Type: application/json');

$fp = @fsockopen('127.0.0.1', 3456, $errno, $errstr, 1);
$connected = false;
if ($fp) {
    $connected = true;
    fclose($fp);
}

// Read the last 20 lines of app.log
$logLines = file_exists('/home2/coastaee/app/app.log') ? array_slice(file('/home2/coastaee/app/app.log'), -25) : [];

echo json_encode([
    'node_listening_3456' => $connected,
    'errno' => $errno,
    'errstr' => $errstr,
    'app_log_tail' => implode("", $logLines)
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_node_status.php', script);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_node_status.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log(res);

  // clean up
  await cp.saveFile('public_html', 'del.php', '<?php @unlink(__DIR__."/test_node_status.php"); @unlink(__FILE__); ?>');
  await new Promise(r => https.get('https://coastaltrails.in/del.php', { rejectUnauthorized: false }, r));
}

main().catch(console.error);
