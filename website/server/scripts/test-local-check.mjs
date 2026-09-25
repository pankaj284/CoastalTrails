import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const testPhp = `<?php
header('Content-Type: application/json');

function check($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $b = curl_exec($ch);
    $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $e = curl_error($ch);
    curl_close($ch);
    return ['code' => $c, 'error' => $e, 'len' => strlen($b)];
}

$health = check('http://127.0.0.1:3456/api/health');
$stays  = check('http://127.0.0.1:3456/api/homestays');

echo json_encode([
    'health' => $health,
    'homestays' => $stays
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_local_check.php', testPhp);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_local_check.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log('Result:\n', res);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_local_check.php', dir: 'public_html' });
}

main().catch(console.error);
