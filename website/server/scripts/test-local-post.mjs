import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Test script that runs curl locally on the server to test 127.0.0.1:3456
  const testPhp = `<?php
header('Content-Type: application/json');

$ch = curl_init('http://127.0.0.1:3456/api/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['identifier' => '+919000000000', 'password' => 'admin@123']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Expect:']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo json_encode([
    'http_code' => $code,
    'error' => $err,
    'body' => json_decode($body, true) ?: $body
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_local_post.php', testPhp);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_local_post.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log('Local PHP to Node POST Result:\n', res);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_local_post.php', dir: 'public_html' });
}

main().catch(console.error);
