import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const probe = `<?php
header('Content-Type: application/json');
echo json_encode([
  'find_node' => trim((string)shell_exec('find /opt /usr/local /usr/bin -name node 2>/dev/null')),
  'cpanel_ea' => trim((string)shell_exec('ls -la /opt/cpanel/ 2>/dev/null')),
  'curl' => trim((string)shell_exec('which curl 2>&1')),
  'tar' => trim((string)shell_exec('which tar 2>&1')),
  'gzip' => trim((string)shell_exec('which gzip 2>&1')),
  'path' => getenv('PATH'),
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'find_node.php', probe);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/find_node.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'find_node.php', dir: 'public_html' });
}

main().catch(console.error);
