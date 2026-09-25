import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // Quote all passwords and secrets in .env
  const prodEnv = [
    'PORT=3456',
    'SITE_URL="https://coastaltrails.in"',
    'DB_HOST="localhost"',
    'DB_PORT=3306',
    'DB_USER="coastaee_dbuser"',
    'DB_PASSWORD="Goodnight01@#DB!"',
    'DB_NAME="coastaee_gokarna"',
    'RAZORPAY_KEY_ID="rzp_live_TenhZxUlBxIbss"',
    'RAZORPAY_KEY_SECRET="oK2b0vv8PikwsmRZipUokZWa"',
    'RAZORPAY_WEBHOOK_SECRET="21c9f1b64efe2c355d9ed08c701ee7f16c5ffa00c5e121c1757d787912093e22"',
    'SMTP_HOST="smtp.gmail.com"',
    'SMTP_PORT=465',
    'SMTP_SECURE="true"',
    'SMTP_USER="bookings@coastaltrails.in"',
    'SMTP_PASS="edkuszqaikkdyxab"',
    'SMTP_PASSWORD="edkuszqaikkdyxab"',
    'MAIL_ADMIN="punithnaik01@gmail.com"',
    'MAIL_REPLY_TO="support@coastaltrails.in"',
    'WHATSAPP_PHONE_NUMBER_ID="1311727232025760"',
    'WHATSAPP_ACCESS_TOKEN="EAAwA3gMfWxIBSucpITp2XZCz8ZAC8vgX9NDmwoftprM4GIkenFOSxn1v6HS8OV84rmZCLwPH6GMCfOt2V2d9iVI2JF5YI82GWc62XsoJo4E4ZB6lKlfasS1C5mUKuz9zXuz6TlQZASQ5Rn5pCqADzhqekz0ESDEcZCxQOGcHxtumm9H96RHbCCsxbZBkrNLrwZDZD"',
    'WHATSAPP_BUSINESS_ACCOUNT_ID="2253205252186390"',
    'WHATSAPP_API_VERSION="v22.0"',
    'WHATSAPP_TEMPLATE_LANG="en"',
    'WHATSAPP_BOOKING_TEMPLATE="ct_booking_confirmed"',
    'WHATSAPP_PAYMENT_TEMPLATE="ct_payment_receipt"',
    'WHATSAPP_PAYMENT_FAILED_TEMPLATE="ct_payment_pending"',
    'WHATSAPP_SIGNUP_TEMPLATE="ct_welcome"',
    '',
  ].join('\n');

  await cp.saveFile('app', '.env', prodEnv);
  console.log('Updated /home2/coastaee/app/.env with quotes.');

  // Now launch Node again
  const testPhp = `<?php
header('Content-Type: application/json');

$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';

// Kill any stuck node process for this user
shell_exec('pkill -u coastaee -f index.js 2>&1');
usleep(200000);

// Launch node
$cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js > $appDir/app.log 2>&1 &";
shell_exec($cmd);

// Wait up to 3 seconds for it to bind
$running = false;
for ($i = 0; $i < 20; $i++) {
    usleep(200000);
    $sock = @stream_socket_client("tcp://127.0.0.1:3456", $errno, $errstr, 0.5);
    if (is_resource($sock)) {
        fclose($sock);
        $running = true;
        break;
    }
}

$log = file_exists("$appDir/app.log") ? file_get_contents("$appDir/app.log") : '';

echo json_encode([
    'running_on_3456' => $running,
    'app_log' => $log
], JSON_PRETTY_PRINT);
`;

  await cp.saveFile('public_html', 'test_launch3.php', testPhp);

  const resBody = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/test_launch3.php', { rejectUnauthorized: false }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });

  console.log('\n--- LAUNCH RESULT ---');
  console.log(resBody);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'test_launch3.php', dir: 'public_html' });
}

main().catch(console.error);
