import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const robustProxy = `<?php
// High-performance reverse proxy from Apache/PHP to Node.js on 127.0.0.1:3456
$targetBase = 'http://127.0.0.1:3456';
$port = 3456;

// Fast health-check / auto-start
$sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.3);
if (!is_resource($sock)) {
    require_once '/home2/coastaee/app/supervisor.php';
} else {
    fclose($sock);
}

// Build target URL
$requestUri = $_SERVER['REQUEST_URI'];
$parts = explode('?', $requestUri, 2);
$path = $parts[0];
$query = isset($parts[1]) ? '?' . $parts[1] : '';

if (!str_starts_with($path, '/api')) {
    $path = '/api' . $path;
}
$targetUrl = $targetBase . $path . $query;

// Forward incoming HTTP headers
$method = $_SERVER['REQUEST_METHOD'];
$headers = ['Expect:']; // Disable 100-continue wait delay

if (function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
        $kLower = strtolower($k);
        if (in_array($kLower, ['host', 'content-length', 'connection', 'expect'])) continue;
        $headers[] = "$k: $v";
    }
} else {
    foreach ($_SERVER as $k => $v) {
        if (str_starts_with($k, 'HTTP_')) {
            $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($k, 5)))));
            if (in_array(strtolower($headerName), ['host', 'content-length', 'connection', 'expect'])) continue;
            $headers[] = "$headerName: $v";
        }
    }
}

// Forward Content-Type if present
if (isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}

$body = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

if ($method !== 'GET' && $method !== 'HEAD' && strlen($body) > 0) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API backend offline or starting up', 'detail' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$rawHeaders = substr($response, 0, $headerSize);
$resBody    = substr($response, $headerSize);
curl_close($ch);

http_response_code($httpCode);

// Pass through response headers cleanly
$headerLines = preg_split('/\\r?\\n/', $rawHeaders);
foreach ($headerLines as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    $lower = strtolower($line);
    if (str_starts_with($lower, 'http/')) continue;
    if (str_starts_with($lower, 'transfer-encoding:')) continue;
    if (str_starts_with($lower, 'connection:')) continue;
    header($line, false);
}

echo $resBody;
`;

  await cp.saveFile('public_html/api', 'index.php', robustProxy);
  console.log('Robust proxy saved to public_html/api/index.php');
}

main().catch(console.error);
