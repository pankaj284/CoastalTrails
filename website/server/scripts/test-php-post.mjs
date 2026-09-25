import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  await cp.saveFile('public_html', 'post_test.php', '<?php echo "Got body: " . file_get_contents("php://input"); ?>');

  const testWithHeaders = async (name, headers, body) => {
    const postBody = body || '';
    const finalHeaders = {
      ...headers,
      'Content-Length': Buffer.byteLength(postBody)
    };
    return new Promise((resolve) => {
      const req = https.request('https://coastaltrails.in/post_test.php', {
        method: 'POST',
        rejectUnauthorized: false,
        headers: finalHeaders
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve({ name, status: res.statusCode, body: b }));
      });
      req.write(postBody);
      req.end();
    });
  };

  const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  
  console.log(await testWithHeaders('Form urlencoded', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': browserUA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }, 'field=value'));

  console.log(await testWithHeaders('Full browser JSON', {
    'Content-Type': 'application/json',
    'User-Agent': browserUA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://coastaltrails.in',
    'Referer': 'https://coastaltrails.in/'
  }, JSON.stringify({ hello: 'world' })));
}

main().catch(console.error);
