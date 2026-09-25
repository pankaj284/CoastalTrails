import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const probe = `<?php
header('Content-Type: application/json');

$sock = @stream_socket_server("tcp://127.0.0.1:39876", $errno, $errstr);
$can_bind = is_resource($sock);
if ($can_bind) {
    fclose($sock);
}

echo json_encode([
    'can_bind_local_port' => $can_bind,
    'errno' => $errno,
    'errstr' => $errstr,
    'curl_extension' => extension_loaded('curl'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'mysqli' => extension_loaded('mysqli'),
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_port.php', probe);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_port.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_port.php', dir: 'public_html' });
}

main().catch(console.error);
