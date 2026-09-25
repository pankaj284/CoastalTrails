import { CPanelClient } from './cpanel-client.mjs';
import fs from 'fs';
import https from 'https';
import path from 'path';

async function uploadFileToCpanel(cp, remoteDir, localFilePath) {
  if (!cp.secToken) await cp.login();
  const filename = path.basename(localFilePath);
  const fileBuffer = fs.readFileSync(localFilePath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="dir"\r\n\r\n` +
    `${remoteDir}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file-1"; filename="${filename}"\r\n` +
    `Content-Type: application/zip\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const fullBody = Buffer.concat([header, fileBuffer, footer]);

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://${cp.host}:2083${cp.secToken}/execute/Fileman/upload_files`,
      {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          Cookie: cp.cookie,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged in to cPanel.');

  // 1. Upload & extract server.zip
  console.log('\n--- UPLOADING SERVER APPLICATION ---');
  await cp.uapi('Fileman', 'mkdir', { path: '/home2/coastaee/app', name: 'app' });
  const upServer = await uploadFileToCpanel(cp, 'app', 'Y:/opencode/Gokarna-Connect/deploy-temp/server.zip');
  console.log('Uploaded server.zip:', upServer.status === 1 ? 'OK' : upServer);

  const extServer = await cp.uapi('Fileman', 'extract_archive', { dir: 'app', file: 'server.zip' });
  console.log('Extracted server.zip:', extServer.status === 1 ? 'OK' : extServer);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'server.zip', dir: 'app' });

  // 2. Upload & extract client.zip to public_html
  console.log('\n--- UPLOADING CLIENT WEB APP ---');
  const upClient = await uploadFileToCpanel(cp, 'public_html', 'Y:/opencode/Gokarna-Connect/deploy-temp/client.zip');
  console.log('Uploaded client.zip:', upClient.status === 1 ? 'OK' : upClient);

  const extClient = await cp.uapi('Fileman', 'extract_archive', { dir: 'public_html', file: 'client.zip' });
  console.log('Extracted client.zip:', extClient.status === 1 ? 'OK' : extClient);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'client.zip', dir: 'public_html' });

  // 3. Upload & extract admin.zip to public_html/admin
  console.log('\n--- UPLOADING ADMIN CONSOLE ---');
  await cp.uapi('Fileman', 'mkdir', { path: '/home2/coastaee/public_html/admin', name: 'admin' });
  const upAdmin = await uploadFileToCpanel(cp, 'public_html/admin', 'Y:/opencode/Gokarna-Connect/deploy-temp/admin.zip');
  console.log('Uploaded admin.zip:', upAdmin.status === 1 ? 'OK' : upAdmin);

  const extAdmin = await cp.uapi('Fileman', 'extract_archive', { dir: 'public_html/admin', file: 'admin.zip' });
  console.log('Extracted admin.zip:', extAdmin.status === 1 ? 'OK' : extAdmin);
  await cp.uapi('Fileman', 'fileop', { op: 'unlink', file: 'admin.zip', dir: 'public_html/admin' });

  console.log('\nAll application files successfully uploaded and extracted!');
}

main().catch(console.error);
