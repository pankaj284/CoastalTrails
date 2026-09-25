import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel successfully.');

  // Create a probe script on the server to check MySQL tables, Node.js binaries, and shell execution
  const probePhp = `<?php
header('Content-Type: application/json');
$result = [];

// 1. MySQL tables
try {
    require_once __DIR__ . '/api/db.php';
    $stmt = $pdo->query('SHOW TABLES');
    $result['mysql_tables'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $result['mysql_status'] = 'connected';
} catch (Exception $e) {
    $result['mysql_error'] = $e->getMessage();
}

// 2. Server commands / binaries
$cmds = [
    'node' => 'node -v 2>&1',
    'which_node' => 'which node 2>&1',
    'npm' => 'npm -v 2>&1',
    'which_npm' => 'which npm 2>&1',
    'git' => 'git --version 2>&1',
    'which_pm2' => 'which pm2 2>&1',
    'uname' => 'uname -a 2>&1',
    'pwd' => 'pwd 2>&1',
];

$result['exec_available'] = function_exists('exec');
$result['shell_exec_available'] = function_exists('shell_exec');

if ($result['shell_exec_available']) {
    foreach ($cmds as $k => $c) {
        $result['commands'][$k] = trim((string)shell_exec($c));
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
`;

  const saveRes = await cp.saveFile('public_html', 'server_probe.php', probePhp);
  console.log('Probe script saved:', saveRes.status === 1 ? 'OK' : saveRes);

  // Fetch probe output
  const output = await new Promise((resolve, reject) => {
    const req = https.request('https://coastaltrails.in/server_probe.php', {
      rejectUnauthorized: false
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
  });

  console.log('\n--- SERVER PROBE RESULTS ---');
  console.log(output);

  // Clean up probe script
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'server_probe.php', dir: 'public_html' });
  console.log('Probe script cleaned up.');
}

main().catch(console.error);
