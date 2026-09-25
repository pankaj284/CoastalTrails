import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';
import querystring from 'querystring';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('1. Logged into cPanel.');

  // 1. Update /home2/coastaee/run_node.sh with robust startup logic
  const runNodeSh = `#!/bin/bash
export PATH="/home2/coastaee/nodejs/bin:/usr/local/bin:/usr/bin:/bin"
export PORT=3458
export NODE_ENV=production

cd /home2/coastaee/app

# Check if port 3458 is responding
if ! /usr/bin/curl -s -m 1 http://127.0.0.1:3458/api/health > /dev/null 2>&1; then
    echo "[$(date -u)] Port 3458 offline, restarting node..." >> /home2/coastaee/app/cron.log
    /usr/bin/pkill -9 -u coastaee -f "node index.js" 2>/dev/null
    sleep 0.5
    nohup /home2/coastaee/nodejs/bin/node index.js </dev/null >> /home2/coastaee/app/app.log 2>&1 &
fi
`;
  await cp.saveFile('', 'run_node.sh', runNodeSh);
  await cp.uapi('Fileman', 'chmod', { dir: '/home2/coastaee', file: 'run_node.sh', perms: '0755' });
  console.log('2. Updated /home2/coastaee/run_node.sh.');

  // 2. Update cron job from */21 to */2 (every 2 minutes)
  const editCronQuery = querystring.stringify({
    cpanel_jsonapi_module: 'Cron',
    cpanel_jsonapi_func: 'edit_line',
    cpanel_jsonapi_apiversion: '2',
    linekey: '1188120115',
    command: '/bin/bash /home2/coastaee/run_node.sh >/dev/null 2>&1',
    minute: '*/2',
    hour: '*',
    day: '*',
    month: '*',
    weekday: '*'
  });

  const cronRes = await new Promise(resolve => {
    https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${editCronQuery}`, {
      rejectUnauthorized: false,
      headers: { Cookie: cp.cookie }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    });
  });
  console.log('3. Updated cron to every 2 minutes:', cronRes);

  // 3. Update public_html/api/index.php with self-healing auto-recovery & retry
  const selfHealingProxyPhp = `<?php
$port = 3458;
$targetBase = "http://127.0.0.1:$port";
$appDir = '/home2/coastaee/app';
$nodeBin = '/home2/coastaee/nodejs/bin/node';

// Function to check if Node is listening on port 3458
function isBackendReady($port) {
    $sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.15);
    if (is_resource($sock)) {
        fclose($sock);
        return true;
    }
    return false;
}

// Function to immediately auto-revive Node daemon
function reviveBackend($appDir, $nodeBin, $port) {
    @shell_exec('pkill -9 -u coastaee -f "node index.js" 2>/dev/null');
    usleep(80000);
    $cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js </dev/null >> $appDir/app.log 2>&1 &";
    @shell_exec($cmd);

    // Wait up to 2.5 seconds for port to open
    for ($i = 0; $i < 25; $i++) {
        usleep(100000);
        if (isBackendReady($port)) {
            return true;
        }
    }
    return false;
}

// Check backend availability before sending request
if (!isBackendReady($port)) {
    reviveBackend($appDir, $nodeBin, $port);
}

// Build destination URL
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

function executeCurl($targetUrl, $method, $headers, $body) {
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    if ($method !== 'GET' && $method !== 'HEAD' && strlen($body) > 0) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [$response, $errno, $error, $headerSize, $httpCode];
}

// First attempt
list($response, $errno, $error, $headerSize, $httpCode) = executeCurl($targetUrl, $method, $headers, $body);

// If first attempt failed to connect, revive backend and retry ONCE
if ($errno !== 0) {
    reviveBackend($appDir, $nodeBin, $port);
    list($response, $errno, $error, $headerSize, $httpCode) = executeCurl($targetUrl, $method, $headers, $body);
}

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

  await cp.saveFile('public_html/api', 'index.php', selfHealingProxyPhp);
  console.log('4. Saved self-healing public_html/api/index.php.');

  // 4. Update app/supervisor.php to also use port 3458
  const supervisorPhp = `<?php
$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';
$port    = 3458;

function isRunning($port) {
    $sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.4);
    if (is_resource($sock)) {
        fclose($sock);
        return true;
    }
    return false;
}

if (!isRunning($port)) {
    @shell_exec('pkill -9 -u coastaee -f "node index.js" 2>/dev/null');
    usleep(100000);
    $cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js </dev/null >> $appDir/app.log 2>&1 &";
    @shell_exec($cmd);

    for ($i = 0; $i < 20; $i++) {
        usleep(100000);
        if (isRunning($port)) break;
    }
}

$running = isRunning($port);

if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    echo json_encode([
        'running' => $running,
        'port' => $port,
        'log' => file_exists("$appDir/app.log") ? substr(file_get_contents("$appDir/app.log"), -600) : ''
    ]);
} else {
    echo $running ? "Node is RUNNING on port $port\\n" : "Node FAILED to start on port $port\\n";
}
`;
  await cp.saveFile('app', 'supervisor.php', supervisorPhp);
  console.log('5. Saved updated app/supervisor.php with port 3458.');
}

main().catch(console.error);
