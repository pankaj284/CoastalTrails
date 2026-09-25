import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel.');

  // 1. Write production .env in /home2/coastaee/app/.env
  console.log('\n--- 1. WRITING PRODUCTION .ENV ---');
  const prodEnv = [
    'PORT=3456',
    'SITE_URL=https://coastaltrails.in',
    'DB_HOST=localhost',
    'DB_PORT=3306',
    'DB_USER=coastaee_dbuser',
    'DB_PASSWORD=Goodnight01@#DB!',
    'DB_NAME=coastaee_gokarna',
    'RAZORPAY_KEY_ID=rzp_live_TenhZxUlBxIbss',
    'RAZORPAY_KEY_SECRET=oK2b0vv8PikwsmRZipUokZWa',
    'RAZORPAY_WEBHOOK_SECRET=21c9f1b64efe2c355d9ed08c701ee7f16c5ffa00c5e121c1757d787912093e22',
    'SMTP_HOST=smtp.gmail.com',
    'SMTP_PORT=465',
    'SMTP_SECURE=true',
    'SMTP_USER=bookings@coastaltrails.in',
    'SMTP_PASS=edkuszqaikkdyxab',
    'SMTP_PASSWORD=edkuszqaikkdyxab',
    'MAIL_ADMIN=punithnaik01@gmail.com',
    'MAIL_REPLY_TO=support@coastaltrails.in',
    'WHATSAPP_PHONE_NUMBER_ID=1311727232025760',
    'WHATSAPP_ACCESS_TOKEN=EAAwA3gMfWxIBSucpITp2XZCz8ZAC8vgX9NDmwoftprM4GIkenFOSxn1v6HS8OV84rmZCLwPH6GMCfOt2V2d9iVI2JF5YI82GWc62XsoJo4E4ZB6lKlfasS1C5mUKuz9zXuz6TlQZASQ5Rn5pCqADzhqekz0ESDEcZCxQOGcHxtumm9H96RHbCCsxbZBkrNLrwZDZD',
    'WHATSAPP_BUSINESS_ACCOUNT_ID=2253205252186390',
    'WHATSAPP_API_VERSION=v22.0',
    'WHATSAPP_TEMPLATE_LANG=en',
    'WHATSAPP_BOOKING_TEMPLATE=ct_booking_confirmed',
    'WHATSAPP_PAYMENT_TEMPLATE=ct_payment_receipt',
    'WHATSAPP_PAYMENT_FAILED_TEMPLATE=ct_payment_pending',
    'WHATSAPP_SIGNUP_TEMPLATE=ct_welcome',
    '',
  ].join('\n');

  await cp.saveFile('app', '.env', prodEnv);
  console.log('Saved /home2/coastaee/app/.env');

  // 2. Create the Node daemon supervisor script in /home2/coastaee/app/supervisor.php
  const supervisorPhp = `<?php
$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';
$pidFile = $appDir . '/app.pid';
$port    = 3456;

function isRunning($port) {
    $sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 1);
    if (is_resource($sock)) {
        fclose($sock);
        return true;
    }
    return false;
}

function startNode($nodeBin, $appDir, $pidFile) {
    $cmd = "cd $appDir && PATH=/home2/coastaee/nodejs/bin:$PATH nohup $nodeBin index.js > $appDir/app.log 2>&1 & echo $!";
    $pid = trim(shell_exec($cmd));
    if ($pid) {
        file_put_contents($pidFile, $pid);
    }
    // Give it a moment to bind
    for ($i = 0; $i < 10; $i++) {
        usleep(200000);
        if (isRunning(3456)) break;
    }
    return $pid;
}

if (!isRunning($port)) {
    startNode($nodeBin, $appDir, $pidFile);
}

if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    echo json_encode([
        'running' => isRunning($port),
        'port' => $port,
        'log' => file_exists("$appDir/app.log") ? substr(file_get_contents("$appDir/app.log"), -500) : ''
    ]);
}
`;
  await cp.saveFile('app', 'supervisor.php', supervisorPhp);
  console.log('Saved /home2/coastaee/app/supervisor.php');

  // 3. Create the API Reverse Proxy in /home2/coastaee/public_html/api/index.php
  const apiProxyPhp = `<?php
// Transparent reverse proxy to the Node.js API server running on 127.0.0.1:3456
$targetBase = 'http://127.0.0.1:3456';
$port = 3456;

// Auto-start Node if not currently running
$sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.5);
if (!is_resource($sock)) {
    require_once '/home2/coastaee/app/supervisor.php';
} else {
    fclose($sock);
}

$requestUri = $_SERVER['REQUEST_URI'];
// Strip query string for path, but keep query for target
$parts = explode('?', $requestUri, 2);
$path = $parts[0];
$query = isset($parts[1]) ? '?' . $parts[1] : '';

// Ensure path begins with /api
if (!str_starts_with($path, '/api')) {
    $path = '/api' . $path;
}
$targetUrl = $targetBase . $path . $query;

$method = $_SERVER['REQUEST_METHOD'];
$headers = [];
foreach (getallheaders() as $key => $val) {
    if (in_array(strtolower($key), ['host', 'content-length', 'connection'])) continue;
    $headers[] = "$key: $val";
}

$body = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

if ($method !== 'GET' && $method !== 'HEAD' && strlen($body) > 0) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API Backend starting up. Please refresh.', 'detail' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$resHeaders = substr($response, 0, $headerSize);
$resBody    = substr($response, $headerSize);
curl_close($ch);

http_response_code($resCode);

foreach (explode("\r\n", $resHeaders) as $h) {
    if (!empty($h) && !str_starts_with(strtolower($h), 'transfer-encoding:') && !str_starts_with(strtolower($h), 'connection:')) {
        header($h, false);
    }
}

echo $resBody;
`;

  // Make sure public_html/api directory exists
  await cp.uapi('Fileman', 'mkdir', { path: '/home2/coastaee/public_html/api', name: 'api' });
  await cp.saveFile('public_html/api', 'index.php', apiProxyPhp);
  console.log('Saved /home2/coastaee/public_html/api/index.php');

  // 4. Create public_html/api/.htaccess to route ALL /api/* requests to index.php
  const apiHtaccess = `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
`;
  await cp.saveFile('public_html/api', '.htaccess', apiHtaccess);
  console.log('Saved /home2/coastaee/public_html/api/.htaccess');

  // 5. Create public_html/.htaccess for main SPA routing + api forwarding + static caching
  const rootHtaccess = `RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Route API requests to public_html/api/index.php
RewriteRule ^api/(.*)$ api/index.php [QSA,L]
RewriteRule ^api$ api/index.php [QSA,L]

# Let existing files and directories through (assets, uploads, admin)
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Client-side SPA fallback to /index.html
RewriteRule ^ index.html [L]
`;
  await cp.saveFile('public_html', '.htaccess', rootHtaccess);
  console.log('Saved /home2/coastaee/public_html/.htaccess');

  // 6. Create public_html/admin/.htaccess for Admin Console SPA routing
  const adminHtaccess = `RewriteEngine On
RewriteBase /admin/

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
`;
  await cp.saveFile('public_html/admin', '.htaccess', adminHtaccess);
  console.log('Saved /home2/coastaee/public_html/admin/.htaccess');

  // 7. Symlink uploads folder: public_html/uploads -> /home2/coastaee/app/uploads
  const linkScript = `<?php
$target = '/home2/coastaee/app/uploads';
$link   = '/home2/coastaee/public_html/uploads';
if (!file_exists($target)) mkdir($target, 0755, true);
if (!file_exists($link)) {
    symlink($target, $link);
}
// Trigger supervisor once to start Node
require_once '/home2/coastaee/app/supervisor.php';
`;
  await cp.saveFile('public_html', 'init_symlink.php', linkScript);
  console.log('Saved and executing init_symlink.php...');

  // Trigger init_symlink
  const initRes = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/init_symlink.php', { rejectUnauthorized: false, timeout: 30000 }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    });
  });
  console.log('Init response:', initRes);

  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'init_symlink.php', dir: 'public_html' });
  console.log('Cleaned up init_symlink.php.');

  // 8. Add a Cron job to ensure the Node backend stays alive 24/7
  console.log('\n--- 8. CONFIGURING CRON JOB (HEALTHCHECK / AUTO-RESTART) ---');
  const cronRes = await cp.uapi('Cron', 'add_line', {
    minute: '*/5',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*',
    command: '/usr/bin/php /home2/coastaee/app/supervisor.php >/dev/null 2>&1',
  }, 'POST');
  console.log('Cron job status:', cronRes.status === 1 ? 'ACTIVE (every 5 mins)' : cronRes);

  console.log('\n======================================================');
  console.log('🎉 PRODUCTION DEPLOYMENT COMPLETE ON COASTALTRAILS.IN!');
  console.log('======================================================\n');
}

main().catch(console.error);
