import https from 'https';

async function testCascadeDelete() {
  // 1. Create a test homestay
  console.log('1. Creating test stay test-stay-999 ...');
  const createStayRes = await new Promise((resolve) => {
    const postData = JSON.stringify({
      id: 'test-stay-999',
      title: 'Automated Test Cascade Stay',
      subtitle: 'Testing deletion of stays with bookings and amenities',
      location: 'kudle',
      location_display: 'Kudle Beach',
      price_per_night: 1500,
      host_name: 'Test Host',
      host_whatsapp: '+919999999999',
      total_rooms: 2,
      description: 'Test stay for cascade delete verification.'
    });

    const req = https.request('https://coastaltrails.in/api/homestays', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.write(postData);
    req.end();
  });

  console.log('Create stay result:', createStayRes.status, createStayRes.body);

  // 2. Add amenities to it
  console.log('\n2. Updating amenities ...');
  const updateRes = await new Promise((resolve) => {
    const postData = JSON.stringify({
      amenities: ['Fast WiFi', 'Hot Shower'],
      verifiedBadges: ['Verified Host']
    });
    const req = https.request('https://coastaltrails.in/api/homestays/test-stay-999', {
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.write(postData);
    req.end();
  });
  console.log('Update result:', updateRes.status);

  // 3. Test deleting the homestay
  console.log('\n3. Testing DELETE /api/homestays/test-stay-999 ...');
  const deleteRes = await new Promise((resolve) => {
    const req = https.request('https://coastaltrails.in/api/homestays/test-stay-999', {
      method: 'DELETE',
      rejectUnauthorized: false
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.end();
  });

  console.log('DELETE status:', deleteRes.status);
  console.log('DELETE body:', deleteRes.body);
}

testCascadeDelete().catch(console.error);
