import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const phpScript = `<?php
$files = [
    'check_tables.php',
    'find_node.php',
    'init_symlink.php',
    'install_node.php',
    'run_import.php',
    'server_probe.php',
    'setup_app.php',
    'test_apache.php',
    'test_exec.php',
    'test_launch.php',
    'test_launch2.php',
    'test_launch3.php',
    'test_port.php',
    'post_test.php',
    'test_local_post.php',
    'del.php',
    'cleanup_temp.php'
];
$deleted = [];
foreach ($files as $f) {
    $p = __DIR__ . '/' . $f;
    if (file_exists($p)) {
        @unlink($p);
        $deleted[] = $f;
    }
}
header('Content-Type: application/json');
echo json_encode(['deleted' => $deleted]);
`;

  await cp.saveFile('public_html', 'cleanup_temp.php', phpScript);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/cleanup_temp.php', { rejectUnauthorized: false }, (r) => {
      let b = '';
      r.on('data', chunk => b += chunk);
      r.on('end', () => resolve(b));
    });
  });

  console.log('Cleanup result:', res);

  // Check file list now
  const list = await cp.listFiles('/home2/coastaee/public_html');
  const files = (list.data || []).map(f => f.file);
  console.log('Current files in public_html:', files);
}

main().catch(console.error);
