import { CPanelClient } from './cpanel-client.mjs';
import fs from 'fs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel.');

  // Read our local SQL backup
  const sqlContent = fs.readFileSync('Y:/Gokarna/Gokarna-Connect-Backup-2026-09-24/coastal_trails_backup_2026-09-24.sql', 'utf8');
  console.log(`Read local SQL dump (${sqlContent.length} bytes).`);

  // Upload SQL file to home directory
  await cp.saveFile('.', 'coastal_trails_import.sql', sqlContent);
  console.log('Uploaded coastal_trails_import.sql to cPanel.');

  // Create import executor PHP script
  const importPhp = `<?php
header('Content-Type: application/json');
set_time_limit(120);

$db = 'coastaee_gokarna';
$user = 'coastaee_dbuser';
$pass = 'Goodnight01@#DB!';
$sqlFile = '/home2/coastaee/coastal_trails_import.sql';

if (!file_exists($sqlFile)) {
    echo json_encode(['error' => 'SQL file missing']);
    exit;
}

$cmd = "mysql -u " . escapeshellarg($user) . " -p" . escapeshellarg($pass) . " " . escapeshellarg($db) . " < " . escapeshellarg($sqlFile) . " 2>&1";
$output = shell_exec($cmd);

// Verify tables imported
try {
    $pdo = new PDO("mysql:host=localhost;dbname=$db;charset=utf8mb4", $user, $pass);
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $counts = [];
    foreach ($tables as $t) {
        $cnt = $pdo->query("SELECT COUNT(*) FROM \`$t\`")->fetchColumn();
        $counts[$t] = $cnt;
    }
    echo json_encode([
        'import_output' => $output,
        'tables_count' => count($tables),
        'table_row_counts' => $counts
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'output' => $output]);
}
`;

  await cp.saveFile('public_html', 'run_import.php', importPhp);
  console.log('run_import.php uploaded, importing MySQL database...');

  const resBody = await new Promise((resolve, reject) => {
    https.get('https://coastaltrails.in/run_import.php', { rejectUnauthorized: false, timeout: 60000 }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log('\n--- DATABASE IMPORT RESULT ---');
  console.log(resBody);

  // Clean up
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'run_import.php', dir: 'public_html' });
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'coastal_trails_import.sql', dir: '.' });
  console.log('Cleaned up run_import.php and import SQL file.');
}

main().catch(console.error);
