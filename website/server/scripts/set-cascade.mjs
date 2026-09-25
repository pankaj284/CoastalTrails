import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const php = `<?php
$pdo = new PDO('mysql:host=localhost;dbname=coastaee_gokarna;charset=utf8mb4', 'coastaee_dbuser', 'Goodnight01@#DB!', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);
try {
    $pdo->exec('ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_homestay');
} catch (Exception $e) {}
$pdo->exec('ALTER TABLE bookings ADD CONSTRAINT fk_bookings_homestay FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE');
echo "Cascade constraint active";
@unlink(__FILE__);
`;

  await cp.saveFile('public_html', 'set_cascade.php', php);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/set_cascade.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log('Result:', res);
}

main().catch(console.error);
