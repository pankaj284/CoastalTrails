import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const probe = `<?php
header('Content-Type: application/json');
$mods = function_exists('apache_get_modules') ? apache_get_modules() : [];
echo json_encode([
  'apache_modules' => $mods,
  'mod_proxy' => in_array('mod_proxy', $mods),
  'mod_rewrite' => in_array('mod_rewrite', $mods),
  'mod_proxy_http' => in_array('mod_proxy_http', $mods),
  'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? '',
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_apache.php', probe);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_apache.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_apache.php', dir: 'public_html' });
}

main().catch(console.error);
