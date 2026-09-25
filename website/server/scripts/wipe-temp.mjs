import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const php = `<?php
foreach (glob(__DIR__ . "/*.php") as $p) {
    if (!str_ends_with($p, "/index.php")) {
        @unlink($p);
    }
}
@unlink(__DIR__ . "/hello.txt");
@unlink(__FILE__);
echo "cleaned";
`;

  await cp.saveFile('public_html', 'wipe.php', php);

  const res = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/wipe.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });

  console.log('Result:', res);

  const list = await cp.listFiles('/home2/coastaee/public_html');
  console.log('Final public_html files:', list.data.map(f => f.file));
}

main().catch(console.error);
