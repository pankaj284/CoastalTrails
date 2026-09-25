import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const probe = `<?php
header('Content-Type: application/json');

// Test if home directory allows executing binaries
$binDir = '/home2/coastaee/bin';
if (!is_dir($binDir)) {
    mkdir($binDir, 0755, true);
}

// Write a small bash script to test execution
$testScript = $binDir . '/test_exec.sh';
file_put_contents($testScript, "#!/bin/bash\\necho 'HELLO_FROM_BIN_EXEC'\\n");
chmod($testScript, 0755);

$output = shell_exec($testScript . ' 2>&1');
unlink($testScript);

echo json_encode([
    'script_output' => trim((string)$output),
    'can_exec_in_home' => strpos($output, 'HELLO_FROM_BIN_EXEC') !== false,
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_exec.php', probe);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_exec.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_exec.php', dir: 'public_html' });
}

main().catch(console.error);
