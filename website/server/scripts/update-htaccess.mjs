import { CPanelClient } from './cpanel-client.mjs';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const ht = `Options -MultiViews
RewriteEngine On
RewriteBase /

<IfModule mod_security.c>
  SecFilterEngine Off
  SecFilterScanPOST Off
</IfModule>
<IfModule mod_security2.c>
  SecRuleEngine Off
</IfModule>

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

  await cp.saveFile('public_html', '.htaccess', ht);
  console.log('Saved root .htaccess');

  // Also update public_html/api/.htaccess
  const apiHt = `Options -MultiViews
RewriteEngine On
<IfModule mod_security.c>
  SecFilterEngine Off
  SecFilterScanPOST Off
</IfModule>
<IfModule mod_security2.c>
  SecRuleEngine Off
</IfModule>
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
`;
  await cp.saveFile('public_html/api', '.htaccess', apiHt);
  console.log('Saved api .htaccess');

  // Test POST request
  const testPost = await new Promise(resolve => {
    const postData = JSON.stringify({ phone: '+919000000000', password: 'admin@123' });
    const req = https.request('https://coastaltrails.in/api/auth/admin/login', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.write(postData);
    req.end();
  });

  console.log('POST Test Status:', testPost.status);
  console.log('POST Test Body:', testPost.body);
}

main().catch(console.error);
