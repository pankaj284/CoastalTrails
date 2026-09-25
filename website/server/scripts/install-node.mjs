import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel.');

  const installScript = `<?php
header('Content-Type: application/json');
set_time_limit(300);

$nodeDir = '/home2/coastaee/nodejs';
$nodeBin = $nodeDir . '/bin/node';

if (file_exists($nodeBin)) {
    $ver = shell_exec($nodeBin . ' -v 2>&1');
    echo json_encode([
        'status' => 'already_installed',
        'version' => trim((string)$ver)
    ], JSON_PRETTY_PRINT);
    exit;
}

// Download Node.js v20 LTS
$url = 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.gz';
$tarFile = '/home2/coastaee/node.tar.gz';

$cmd = "curl -sSL '$url' -o '$tarFile' 2>&1 && " .
       "mkdir -p '$nodeDir' 2>&1 && " .
       "tar -xzf '$tarFile' --strip-components=1 -C '$nodeDir' 2>&1 && " .
       "rm -f '$tarFile' 2>&1";

$output = shell_exec($cmd);
$ver = file_exists($nodeBin) ? shell_exec($nodeBin . ' -v 2>&1') : 'not found';

echo json_encode([
    'output' => $output,
    'node_exists' => file_exists($nodeBin),
    'node_version' => trim((string)$ver),
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'install_node.php', installScript);
  console.log('install_node.php uploaded, executing...');

  const resBody = await new Promise((resolve, reject) => {
    const req = https.get('https://coastaltrails.in/install_node.php', { rejectUnauthorized: false, timeout: 120000 }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
    req.on('error', reject);
  });

  console.log('\nInstall result:', resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'install_node.php', dir: 'public_html' });
  console.log('install_node.php cleaned up.');
}

main().catch(console.error);
