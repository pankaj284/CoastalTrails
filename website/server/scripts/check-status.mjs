import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const php = `<?php
header('Content-Type: text/plain');
echo "=== PROCESSES ===\\n";
echo shell_exec('ps -u coastaee -f 2>&1');
echo "\\n=== NETSTAT / SS ===\\n";
echo shell_exec('ss -tlpn 2>&1 | grep 3456');
echo "\\n=== APP LOG TAIL ===\\n";
echo file_exists('/home2/coastaee/app/app.log') ? substr(file_get_contents('/home2/coastaee/app/app.log'), -1500) : 'NO LOG';
`;

  await cp.saveFile('public_html', 'status_check.php', php);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/status_check.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log(res);

  // Clean up
  await cp.saveFile('public_html', 'clean_status.php', '<?php @unlink(__DIR__."/status_check.php"); @unlink(__FILE__); ?>');
  await new Promise(r => https.get('https://coastaltrails.in/clean_status.php', { rejectUnauthorized: false }, r));
}

main().catch(console.error);
