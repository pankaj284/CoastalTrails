import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  // 1. Get public_html/admin/index.html and rewrite /assets/ to /admin/assets/
  const adminIndex = await cp.getFile('public_html/admin', 'index.html');
  const updatedHtml = adminIndex.data.content
    .replaceAll('href="/assets/', 'href="/admin/assets/')
    .replaceAll('src="/assets/', 'src="/admin/assets/');
  await cp.saveFile('public_html/admin', 'index.html', updatedHtml);
  console.log('1. Updated public_html/admin/index.html to use /admin/assets/');

  // 2. Also copy all files from public_html/admin/assets into public_html/assets for redundancy
  const adminAssets = await cp.listFiles('/home2/coastaee/public_html/admin/assets');
  for (const f of adminAssets.data) {
    if (f.file && f.type === 'file') {
      try {
        const fileContent = await cp.getFile('public_html/admin/assets', f.file);
        await cp.saveFile('public_html/assets', f.file, fileContent.data.content);
        console.log(`Copied ${f.file} to root assets.`);
      } catch (err) {
        console.warn(`Could not copy ${f.file}:`, err.message);
      }
    }
  }

  // 3. Ensure public_html/admin/.htaccess handles client-side routing
  const adminHtaccess = `Options -MultiViews
RewriteEngine On
RewriteBase /admin/

# Fallback all non-file/dir requests to /admin/index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
`;
  await cp.saveFile('public_html/admin', '.htaccess', adminHtaccess);
  console.log('3. Saved public_html/admin/.htaccess');
}

main().catch(console.error);
