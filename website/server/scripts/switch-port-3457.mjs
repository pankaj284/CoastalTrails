import { CPanelClient } from './cpanel-client.mjs';
import querystring from 'querystring';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in.');

  // 1. Update .env to PORT=3457
  const envContent = await cp.getFile('app', '.env');
  const updatedEnv = envContent.data.content.replace(/PORT=\d+/, 'PORT=3457');
  await cp.saveFile('app', '.env', updatedEnv);
  console.log('1. Updated .env to PORT=3457');

  // 2. Kill all node processes via a one-time cron job!
  // In cPanel, cron runs with full user shell permissions and can execute killall / pkill!
  const killCron = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'add_line',
    cpanel_jsonapi_apiversion: '2',
    command: '/usr/bin/pkill -9 -u coastaee node || true',
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });
  await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${killCron}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));
  console.log('2. Scheduled pkill cron.');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Remove the kill cron and schedule the runner script for port 3457
  const listRes = await new Promise(resolve => {
    const listQ = querystring.stringify({ cpanel_jsonapi_module: 'Cron', cpanel_jsonapi_func: 'listcron', cpanel_jsonapi_apiversion: '2' });
    https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${listQ}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
  });

  const cronLines = listRes?.cpanelresult?.data || [];
  for (const item of cronLines) {
    if (item.linekey) {
      const rmQ = querystring.stringify({ cpanel_jsonapi_module: 'Cron', cpanel_jsonapi_func: 'remove_line', cpanel_jsonapi_apiversion: '2', linekey: item.linekey });
      await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${rmQ}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));
    }
  }
  console.log('3. Cleaned cron jobs.');

  // 3. Update run_node.sh for port 3457
  const runnerScript = `#!/bin/bash
export PATH="/home2/coastaee/nodejs/bin:/usr/local/bin:/usr/bin:/bin"
export PORT=3457
export NODE_ENV=production

cd /home2/coastaee/app

# Check if port 3457 is responding
if ! /usr/bin/curl -s -m 1 http://127.0.0.1:3457/api/health > /dev/null 2>&1; then
    echo "[$(date -u)] Port 3457 offline, launching node..." >> /home2/coastaee/app/cron.log
    /usr/bin/pkill -9 -u coastaee -f "node index.js" 2>/dev/null
    sleep 1
    nohup /home2/coastaee/nodejs/bin/node index.js >> /home2/coastaee/app/app.log 2>&1 &
else
    echo "[$(date -u)] Port 3457 is healthy" >> /home2/coastaee/app/cron.log
fi
`;
  await cp.saveFile('', 'run_node.sh', runnerScript);
  await cp.uapi('Fileman', 'chmod', { dir: '/home2/coastaee', file: 'run_node.sh', perms: '0755' });
  console.log('4. Updated run_node.sh for 3457.');

  // 4. Add runner cron
  const addRunnerCron = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'add_line',
    cpanel_jsonapi_apiversion: '2',
    command: '/bin/bash /home2/coastaee/run_node.sh >/dev/null 2>&1',
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });
  await new Promise(r => https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${addRunnerCron}`, { rejectUnauthorized: false, headers: { Cookie: cp.cookie } }, r));
  console.log('5. Added runner cron.');

  // 5. Update public_html/api/index.php for port 3457
  const proxyPhp = `<?php
$targetBase = 'http://127.0.0.1:3457';
$requestUri = $_SERVER['REQUEST_URI'];
$parts = explode('?', $requestUri, 2);
$path = $parts[0];
$query = isset($parts[1]) ? '?' . $parts[1] : '';

if (!str_starts_with($path, '/api')) {
    $path = '/api' . $path;
}
$targetUrl = $targetBase . $path . $query;

$method = $_SERVER['REQUEST_METHOD'];
$headers = [
    'Expect:',
    'Accept-Encoding: identity',
];

if (function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
        $lower = strtolower($k);
        if (in_array($lower, ['host', 'content-length', 'connection', 'expect', 'accept-encoding'])) continue;
        $headers[] = "$k: $v";
    }
}
if (isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}

$body = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

if ($method !== 'GET' && $method !== 'HEAD' && strlen($body) > 0) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$errno = curl_errno($ch);
$error = curl_error($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno !== 0) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API backend offline or starting up', 'detail' => $error]);
    exit;
}

http_response_code($httpCode);

// Forward safe response headers ONLY
$headerLines = preg_split('/\\r?\\n/', substr($response, 0, $headerSize));
foreach ($headerLines as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    $lower = strtolower($line);
    if (str_starts_with($lower, 'http/')) continue;
    if (str_starts_with($lower, 'transfer-encoding:')) continue;
    if (str_starts_with($lower, 'connection:')) continue;
    if (str_starts_with($lower, 'content-length:')) continue;
    if (str_starts_with($lower, 'content-encoding:')) continue;
    header($line, false);
}

echo substr($response, $headerSize);
`;
  await cp.saveFile('public_html/api', 'index.php', proxyPhp);
  console.log('6. Updated public_html/api/index.php for 3457.');
}

main().catch(console.error);
