import { CPanelClient } from './cpanel-client.mjs';

async function main() {
  const cp = new CPanelClient('66.116.209.42', 'coastaee', 'Mithila2206@#');
  await cp.login();

  const supervisorPhp = `<?php
$nodeBin = '/home2/coastaee/nodejs/bin/node';
$appDir  = '/home2/coastaee/app';
$port    = 3456;

function isNodeRunning($port) {
    $sock = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, 0.5);
    if (is_resource($sock)) {
        fclose($sock);
        return true;
    }
    return false;
}

function ensureNodeRunning($nodeBin, $appDir, $port) {
    if (isNodeRunning($port)) {
        return true;
    }
    // Launch node using full path to nohup
    $cmd = "cd $appDir && /usr/bin/nohup $nodeBin index.js > $appDir/app.log 2>&1 &";
    shell_exec($cmd);
    
    // Wait up to 3 seconds for it to bind
    for ($i = 0; $i < 15; $i++) {
        usleep(200000);
        if (isNodeRunning($port)) return true;
    }
    return isNodeRunning($port);
}

$started = ensureNodeRunning($nodeBin, $appDir, $port);

// Only output json if accessed directly
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === realpath(__FILE__)) {
    header('Content-Type: application/json');
    echo json_encode([
        'running' => $started,
        'port' => $port,
        'log' => file_exists("$appDir/app.log") ? substr(file_get_contents("$appDir/app.log"), -500) : ''
    ]);
}
`;

  await cp.saveFile('app', 'supervisor.php', supervisorPhp);
  console.log('Successfully updated /home2/coastaee/app/supervisor.php');

  // Also check if we can add a cron job in cPanel to run supervisor every 5 minutes
  try {
    const cronList = await cp.uapi('Cron', 'list_cron');
    console.log('Current cron jobs:', JSON.stringify(cronList?.data || []));

    const cronLine = '/usr/bin/php /home2/coastaee/app/supervisor.php >/dev/null 2>&1';
    const exists = (cronList?.data || []).some(c => (c.command || '').includes('supervisor.php'));
    if (!exists) {
      const addRes = await cp.uapi('Cron', 'add_line', {
        command: cronLine,
        minute: '*/5',
        hour: '*',
        day: '*',
        month: '*',
        weekday: '*'
      });
      console.log('Added cron watchdog job:', addRes?.status === 1 ? 'SUCCESS' : JSON.stringify(addRes));
    } else {
      console.log('Watchdog cron job already exists.');
    }
  } catch (err) {
    console.warn('Cron setup warning:', err.message);
  }
}

main().catch(console.error);
