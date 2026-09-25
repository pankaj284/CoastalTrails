import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const rootHt = `Options -MultiViews
RewriteEngine On
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

  await cp.saveFile('public_html', '.htaccess', rootHt);

  const apiHt = `Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
`;
  await cp.saveFile('public_html/api', '.htaccess', apiHt);

  console.log('Cleaned htaccess saved.');
}

main().catch(console.error);
