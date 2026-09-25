import https from 'https';

async function testCascadeWithBooking() {
  // 1. Create a test stay
  const postData = JSON.stringify({
    id: 'test-booked-stay',
    title: 'Test Stay with Booking',
    subtitle: 'Subtitle',
    location: 'om',
    location_display: 'Om Beach',
    price_per_night: 1200,
    host_name: 'Host Name',
    host_whatsapp: '+919876543210',
    total_rooms: 2,
    description: 'A test stay.'
  });

  await new Promise(resolve => {
    const req = https.request('https://coastaltrails.in/api/homestays', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, r => { r.resume(); r.on('end', resolve); });
    req.write(postData);
    req.end();
  });
  console.log('1. Created stay test-booked-stay');

  // 2. Create a booking for this stay
  const bookingData = JSON.stringify({
    homestay_id: 'test-booked-stay',
    user_name: 'Test Booker',
    user_phone: '+919888877777',
    check_in: '2026-10-15',
    check_out: '2026-10-17',
    guests_count: 2
  });

  const bRes = await new Promise(resolve => {
    const req = https.request('https://coastaltrails.in/api/bookings', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bookingData) }
    }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve({ status: r.statusCode, body: b }));
    });
    req.write(bookingData);
    req.end();
  });
  console.log('2. Created booking for stay:', bRes.status, bRes.body.substring(0, 100));

  // 3. Now attempt DELETE on this stay
  console.log('3. Deleting stay that has an active booking...');
  const delRes = await new Promise(resolve => {
    const req = https.request('https://coastaltrails.in/api/homestays/test-booked-stay', {
      method: 'DELETE',
      rejectUnauthorized: false
    }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve({ status: r.statusCode, body: b }));
    });
    req.end();
  });
  console.log('Delete result status:', delRes.status);
  console.log('Delete result body:', delRes.body);
}

testCascadeWithBooking().catch(console.error);
