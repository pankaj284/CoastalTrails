import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  await cp.saveFile('public_html', 'info.php', '<?php echo "PHP is alive: " . phpversion(); ?>');
  console.log('Saved info.php');
}

main().catch(console.error);
