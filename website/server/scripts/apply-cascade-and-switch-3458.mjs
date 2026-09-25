import { CPanelClient } from './cpanel-client.mjs';
import querystring from 'querystring';
import https from 'https';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();
  console.log('Logged into cPanel.');

  // Step 1: Run SQL migration via PHP PDO to alter foreign key constraint and restore gokarna-12
  const sqlPhp = `<?php
header('Content-Type: application/json');
try {
    $pdo = new PDO('mysql:host=localhost;dbname=coastaee_gokarna;charset=utf8mb4', 'coastaee_dbuser', 'Goodnight01@#DB!', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Check if fk_bookings_homestay exists and drop it
    try {
        $pdo->exec("ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_homestay");
    } catch (Exception $e) {
        // ignore if not exists
    }

    // Add ON DELETE CASCADE
    $pdo->exec("ALTER TABLE bookings ADD CONSTRAINT fk_bookings_homestay FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE");

    // Restore gokarna-12 if missing
    $check12 = $pdo->query("SELECT id FROM homestays WHERE id = 'gokarna-12'")->fetch();
    if (!$check12) {
        $pdo->exec("INSERT INTO homestays (id, title, subtitle, location, location_display, price_per_night, rating, reviews_count, host_name, host_whatsapp, is_host_verified, walking_minutes_to_beach, total_rooms, availability_listed, status, instant_booking, description)
            VALUES ('gokarna-12', 'Kudle Backpacker Garden Rooms', 'Green garden rooms for travelers on a budget', 'kudle', 'Kudle Beach', 950, 4.6, 203, 'Ramesh Achari', '+919448901122', 0, 5, 6, 1, 'live', 1, 'Simple, spotless garden rooms behind Kudle’s main cafe strip. Shared kitchen, weekly bonfires and a noticeboard full of treks, scooter shares and boat rides. The social heart of the Kudle backpacker scene.')");
        
        $pdo->exec("INSERT INTO homestay_images (homestay_id, image_url, sort_order, category) VALUES 
            ('gokarna-12', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', 0, 'general'),
            ('gokarna-12', 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80', 1, 'general')");

        $pdo->exec("INSERT INTO homestay_amenities (homestay_id, amenity) VALUES
            ('gokarna-12', 'Shared Guest Kitchen'),
            ('gokarna-12', 'Common Hammock Garden'),
            ('gokarna-12', '24h Check-in'),
            ('gokarna-12', 'Lockers'),
            ('gokarna-12', 'Cafe Strip 1 Min Away')");

        $pdo->exec("INSERT INTO homestay_badges (homestay_id, badge) VALUES
            ('gokarna-12', 'Budget Friendly'),
            ('gokarna-12', 'Kitchen Access')");
    }

    echo json_encode(['success' => true, 'message' => 'Foreign key constraint updated and gokarna-12 restored']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
`;
  await cp.saveFile('public_html', 'run_sql.php', sqlPhp);
  const sqlRes = await new Promise(resolve => {
    https.get('https://coastaltrails.in/run_sql.php', { rejectUnauthorized: false }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
    });
  });
  console.log('SQL Migration Result:\n', sqlRes);
  await cp.saveFile('public_html', 'clean_sql.php', '<?php @unlink(__DIR__."/run_sql.php"); @unlink(__FILE__); ?>');
  await new Promise(r => https.get('https://coastaltrails.in/clean_sql.php', { rejectUnauthorized: false }, r));

  // Step 2: Switch port to 3458 to start fresh node instance
  const envContent = await cp.getFile('app', '.env');
  const updatedEnv = envContent.data.content.replace(/PORT=\d+/, 'PORT=3458');
  await cp.saveFile('app', '.env', updatedEnv);
  console.log('2. Updated .env to PORT=3458');

  // Step 3: Update run_node.sh for 3458
  const runnerScript = `#!/bin/bash
export PATH="/home2/coastaee/nodejs/bin:/usr/local/bin:/usr/bin:/bin"
export PORT=3458
export NODE_ENV=production

cd /home2/coastaee/app

# Check if port 3458 is responding
if ! /usr/bin/curl -s -m 1 http://127.0.0.1:3458/api/health > /dev/null 2>&1; then
    echo "[$(date -u)] Port 3458 offline, launching node..." >> /home2/coastaee/app/cron.log
    /usr/bin/pkill -9 -u coastaee -f "node index.js" 2>/dev/null
    sleep 1
    nohup /home2/coastaee/nodejs/bin/node index.js >> /home2/coastaee/app/app.log 2>&1 &
else
    echo "[$(date -u)] Port 3458 is healthy" >> /home2/coastaee/app/cron.log
fi
`;
  await cp.saveFile('', 'run_node.sh', runnerScript);
  await cp.uapi('Fileman', 'chmod', { dir: '/home2/coastaee', file: 'run_node.sh', perms: '0755' });
  console.log('3. Updated run_node.sh for 3458');

  // Step 4: Update public_html/api/index.php for 3458
  const apiProxyContent = await cp.getFile('public_html/api', 'index.php');
  const updatedProxy = apiProxyContent.data.content.replace(/127\.0\.0\.1:\d+/, '127.0.0.1:3458');
  await cp.saveFile('public_html/api', 'index.php', updatedProxy);
  console.log('4. Updated api/index.php for 3458');
}

main().catch(console.error);
