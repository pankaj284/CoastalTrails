import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Save a diagnostic script inside app directory (not public_html) and run via php CLI or supervisor
  // Or save in public_html/test_diag.php
  const diagPhp = `<?php
header('Content-Type: text/plain');

echo "1. Checking if Node is alive via stream_socket_client:\\n";
$start = microtime(true);
$sock = @stream_socket_client("tcp://127.0.0.1:3456", $errno, $errstr, 1);
$time = round(microtime(true) - $start, 4);
if ($sock) {
    echo "SUCCESS: Connected in {$time}s\\n";
    fclose($sock);
} else {
    echo "FAILED in {$time}s: ($errno) $errstr\\n";
}

echo "\\n2. Testing curl to 127.0.0.1:3456/api/health:\\n";
$ch = curl_init('http://127.0.0.1:3456/api/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
echo "Result: code=$code, err=$err, body=$body\\n";

echo "\\n3. Process list for coastaee:\\n";
echo shell_exec('pgrep -a -u coastaee 2>&1');
`;

  await cp.saveFile('public_html', 'test_diag.php', diagPhp);
  console.log('Saved test_diag.php');
}

main().catch(console.error);
