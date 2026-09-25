import { CPanelClient } from './cpanel-client.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import querystring from 'querystring';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('1. Logged into cPanel.');

  // Step 1: Upload updated index.js with crash guards
  const localIndexJs = fs.readFileSync(path.resolve('./index.js'), 'utf-8');
  await cp.saveFile('app', 'index.js', localIndexJs);
  console.log('2. Uploaded updated index.js with crash guards.');

  // Step 2: Upload robust supervisor.php
  const supervisorPhp = `<?php
$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';
$port    = 3456;

function isRunning($port) {
    $sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.4);
    if (is_resource($sock)) {
        fclose($sock);
        return true;
    }
    return false;
}

if (!isRunning($port)) {
    // Kill any defunct processes
    @shell_exec('pkill -u coastaee -f "node index.js" 2>/dev/null');
    usleep(100000);

    // Launch completely detached with stdin from /dev/null
    $cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js </dev/null >> $appDir/app.log 2>&1 &";
    @shell_exec($cmd);

    for ($i = 0; $i < 15; $i++) {
        usleep(200000);
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
  console.log('3. Uploaded supervisor.php.');

  // Step 3: Upload robust, non-blocking api/index.php
  const apiProxyPhp = `<?php
$targetBase = 'http://127.0.0.1:3456';
$requestUri = $_SERVER['REQUEST_URI'];
$parts = explode('?', $requestUri, 2);
$path = $parts[0];
$query = isset($parts[1]) ? '?' . $parts[1] : '';

if (!str_starts_with($path, '/api')) {
    $path = '/api' . $path;
}
$targetUrl = $targetBase . $path . $query;

function forwardRequest($targetUrl) {
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
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
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

    return [
        'ok' => ($errno === 0),
        'errno' => $errno,
        'error' => $error,
        'code' => $httpCode,
        'headers' => ($errno === 0) ? substr($response, 0, $headerSize) : '',
        'body' => ($errno === 0) ? substr($response, $headerSize) : ''
    ];
}

$res = forwardRequest($targetUrl);

// If Node was down, launch it and retry once
if (!$res['ok']) {
    @include_once '/home2/coastaee/app/supervisor.php';
    usleep(500000);
    $res = forwardRequest($targetUrl);
}

if (!$res['ok']) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API Gateway: Backend server unavailable', 'detail' => $res['error']]);
    exit;
}

http_response_code($res['code']);

// Forward safe response headers ONLY
$headerLines = preg_split('/\\r?\\n/', $res['headers']);
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

echo $res['body'];
`;
  await cp.saveFile('public_html/api', 'index.php', apiProxyPhp);
  console.log('4. Uploaded robust public_html/api/index.php.');

  // Step 4: Add Cron watchdog via cPanel API 2
  try {
    const cronCmd = '/usr/bin/php /home2/coastaee/app/supervisor.php >/dev/null 2>&1';
    const cronParams = querystring.stringify({
      cpanel_jsonapi_module: 'Cron',
      cpanel_jsonapi_func: 'add_line',
      cpanel_jsonapi_apiversion: '2',
      command: cronCmd,
      minute: '*/2',
      hour: '*',
      day: '*',
      month: '*',
      weekday: '*'
    });
    const addCronRes = await new Promise((resolve) => {
      https.get(`https://${cp.host}:2083${cp.secToken}/json-api/cpanel?${cronParams}`, {
        rejectUnauthorized: false,
        headers: { Cookie: cp.cookie }
      }, r => {
        let b = '';
        r.on('data', c => b += c);
        r.on('end', () => resolve(b));
      });
    });
    console.log('5. Cron watchdog setup result:', addCronRes);
  } catch (err) {
    console.warn('Cron setup warning:', err.message);
  }

  // Step 5: Clean test files
  await cp.saveFile('public_html', 'clean_all.php', '<?php @unlink(__DIR__."/test_diag.php"); @unlink(__DIR__."/test_local_check.php"); @unlink(__FILE__); echo "cleaned"; ?>');
  await new Promise(r => https.get('https://coastaltrails.in/clean_all.php', { rejectUnauthorized: false }, r));
  console.log('6. Cleaned temporary files.');

  // Step 6: Trigger supervisor to ensure Node starts immediately
  await cp.saveFile('public_html', 'start_now.php', '<?php require_once "/home2/coastaee/app/supervisor.php"; @unlink(__FILE__); ?>');
  const startRes = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/start_now.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });
  console.log('7. Triggered start_now.php:\n', startRes);

  // Step 7: Test live API /api/homestays
  console.log('\n8. Testing https://coastaltrails.in/api/homestays ...');
  const testRes = await new Promise((resolve) => {
    https.get('https://coastaltrails.in/api/homestays', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve({ status: r.statusCode, length: b.length, snippet: b.substring(0, 120) }));
    });
  });
  console.log('Result:', testRes);
}

main().catch(console.error);
