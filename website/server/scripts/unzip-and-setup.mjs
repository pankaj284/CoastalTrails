import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel.');

  // Script to unzip files, install dependencies, and setup configs
  const setupPhp = `<?php
header('Content-Type: application/json');
set_time_limit(300);

$res = [];

// 1. Unzip server.zip in /home2/coastaee/app
if (file_exists('/home2/coastaee/app/server.zip')) {
    $res['unzip_server'] = shell_exec('unzip -q -o /home2/coastaee/app/server.zip -d /home2/coastaee/app 2>&1');
    unlink('/home2/coastaee/app/server.zip');
    $res['server_files'] = count(glob('/home2/coastaee/app/*'));
}

// 2. Unzip client.zip in /home2/coastaee/public_html
if (file_exists('/home2/coastaee/public_html/client.zip')) {
    $res['unzip_client'] = shell_exec('unzip -q -o /home2/coastaee/public_html/client.zip -d /home2/coastaee/public_html 2>&1');
    unlink('/home2/coastaee/public_html/client.zip');
    $res['public_html_files'] = count(glob('/home2/coastaee/public_html/*'));
}

// 3. Unzip admin.zip in /home2/coastaee/public_html/admin
if (file_exists('/home2/coastaee/public_html/admin/admin.zip')) {
    $res['unzip_admin'] = shell_exec('unzip -q -o /home2/coastaee/public_html/admin/admin.zip -d /home2/coastaee/public_html/admin 2>&1');
    unlink('/home2/coastaee/public_html/admin/admin.zip');
    $res['admin_files'] = count(glob('/home2/coastaee/public_html/admin/*'));
}

// 4. Run npm install --omit=dev in /home2/coastaee/app
$npmPath = '/home2/coastaee/nodejs/bin/npm';
$nodeBin = '/home2/coastaee/nodejs/bin/node';
$nodeDir = '/home2/coastaee/nodejs/bin';

$cmd = "export PATH=$nodeDir:$PATH && cd /home2/coastaee/app && $npmPath install --omit=dev 2>&1";
$res['npm_install'] = shell_exec($cmd);

echo json_encode($res, JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'setup_app.php', setupPhp);
  console.log('setup_app.php uploaded, executing unzips and npm install...');

  const resBody = await new Promise((resolve, reject) => {
    https.get('https://coastaltrails.in/setup_app.php', { rejectUnauthorized: false, timeout: 180000 }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log('\n--- SETUP RESULTS ---');
  console.log(resBody);

  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'setup_app.php', dir: 'public_html' });
  console.log('Cleaned up setup_app.php.');
}

main().catch(console.error);
