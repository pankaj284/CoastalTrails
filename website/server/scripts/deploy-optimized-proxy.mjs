import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const proxyPhp = `<?php
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
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
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

// Forward safe response headers ONLY (Never forward Content-Length, Transfer-Encoding, Connection, or Content-Encoding)
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

  await cp.saveFile('public_html/api', 'index.php', proxyPhp);
  console.log('Saved optimized proxy to public_html/api/index.php');
}

main().catch(console.error);
