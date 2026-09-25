import 'dotenv/config';

const BASE_API = 'http://localhost:5000';
const BASE_CLIENT = 'http://localhost:4173';
const BASE_ADMIN = 'http://localhost:3002';

const results = [];

function pass(name, detail = '') {
  results.push({ status: 'PASS', name, detail });
  console.log(`  [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
}

function fail(name, error) {
  results.push({ status: 'FAIL', name, detail: error });
  console.log(`  [FAIL] ${name} -> ${error}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log(' COASTAL TRAILS - COMPREHENSIVE TEST SUITE');
  console.log('========================================\n');

  // --- SECTION 1: FRONTEND PAGES (:4173) ---
  console.log('1. Checking Traveler App Pages (:4173)...');
  const clientPages = [
    { path: '/', name: 'Explore / Home Page' },
    { path: '/trails', name: 'Trails & Culture (Gokarna Journal)' },
    { path: '/stays/stay-01', name: 'Stay Detail Page' },
    { path: '/bookings', name: 'My Bookings Page' },
    { path: '/studio', name: 'Database Studio Page' },
    { path: '/survey', name: 'Survey Workspace Page' },
  ];

  for (const page of clientPages) {
    try {
      const res = await fetch(`${BASE_CLIENT}${page.path}`);
      if (res.status === 200) {
        pass(`Page: ${page.name}`, `HTTP ${res.status}`);
      } else {
        fail(`Page: ${page.name}`, `HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`Page: ${page.name}`, e.message);
    }
  }

  // --- SECTION 2: ADMIN CONSOLE (:3002) ---
  console.log('\n2. Checking Admin Console (:3002)...');
  try {
    const res = await fetch(`${BASE_ADMIN}/`);
    if (res.status === 200) {
      pass('Admin Console Home', `HTTP ${res.status}`);
    } else {
      fail('Admin Console Home', `HTTP ${res.status}`);
    }
  } catch (e) {
    fail('Admin Console Home', e.message);
  }

  // --- SECTION 3: CORE BACKEND REST API (:5000) ---
  console.log('\n3. Checking Core REST API Endpoints (:5000)...');
  
  // Homestays
  try {
    const res = await fetch(`${BASE_API}/api/homestays`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data) && data.length > 0) {
      pass('GET /api/homestays', `${data.length} homestays loaded`);
    } else {
      fail('GET /api/homestays', `Returned ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/homestays', e.message);
  }

  // Single Homestay
  try {
    const res = await fetch(`${BASE_API}/api/homestays/gokarna-1`);
    const data = await res.json();
    if (res.status === 200 && data.id === 'gokarna-1' && data.title) {
      pass('GET /api/homestays/gokarna-1', `"${data.title}", price: ₹${data.price_per_night}`);
    } else {
      fail('GET /api/homestays/gokarna-1', `Returned ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/homestays/gokarna-1', e.message);
  }

  // Routes
  try {
    const res = await fetch(`${BASE_API}/api/routes`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      pass('GET /api/routes', `${data.length} transit routes loaded`);
    } else {
      fail('GET /api/routes', `Returned ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/routes', e.message);
  }

  // Enclaves
  try {
    const res = await fetch(`${BASE_API}/api/enclaves`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      pass('GET /api/enclaves', `${data.length} enclaves loaded`);
    } else {
      fail('GET /api/enclaves', `Returned ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/enclaves', e.message);
  }

  // Reviews
  try {
    const res = await fetch(`${BASE_API}/api/reviews?homestay_id=gokarna-1`);
    const data = await res.json();
    if (res.status === 200 && data.reviews) {
      pass('GET /api/reviews?homestay_id=gokarna-1', `${data.reviews.length} reviews loaded, avg rating: ${data.summary?.average?.toFixed(1) || 'N/A'}`);
    } else {
      fail('GET /api/reviews?homestay_id=gokarna-1', `Returned ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/reviews?homestay_id=gokarna-1', e.message);
  }

  // --- SECTION 4: AUTH & ADMIN API ---
  console.log('\n4. Checking Admin & Auth Integration...');
  let adminToken = null;
  try {
    const res = await fetch(`${BASE_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+919000000000', password: 'admin@123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token && data.role === 'admin') {
      adminToken = data.token;
      pass('POST /api/auth/login (Admin)', `Token acquired, role: ${data.role}`);
    } else {
      fail('POST /api/auth/login (Admin)', data.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    fail('POST /api/auth/login (Admin)', e.message);
  }

  if (adminToken) {
    // Admin Bookings
    try {
      const res = await fetch(`${BASE_API}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data)) {
        pass('GET /api/admin/bookings', `${data.length} bookings listed in PMS`);
      } else {
        fail('GET /api/admin/bookings', `Returned ${res.status}`);
      }
    } catch (e) {
      fail('GET /api/admin/bookings', e.message);
    }

    // Admin Stats
    try {
      const res = await fetch(`${BASE_API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        pass('GET /api/admin/stats', `Active holds: ${data.active_holds || 0}, Confirmed: ${data.confirmed_stays || 0}`);
      } else {
        fail('GET /api/admin/stats', `Returned ${res.status}`);
      }
    } catch (e) {
      fail('GET /api/admin/stats', e.message);
    }

    // Admin Homestays PMS room status
    try {
      const res = await fetch(`${BASE_API}/api/admin/stays/gokarna-1/room-status`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        pass('GET /api/admin/stays/:id/room-status', 'PMS room matrix loaded');
      } else {
        fail('GET /api/admin/stays/:id/room-status', `Returned ${res.status}`);
      }
    } catch (e) {
      fail('GET /api/admin/stays/:id/room-status', e.message);
    }
  }

  // --- SECTION 5: END-TO-END BOOKING & PAYMENT LIFECYCLE ---
  console.log('\n5. Checking End-to-End Booking Lifecycle...');
  let travelerToken = null;
  // Sign in or use existing traveler account
  try {
    const loginRes = await fetch(`${BASE_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'punit@example.com', password: 'password123' })
    });
    let loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      travelerToken = loginData.token;
      pass('Traveler Login', `Logged in as ${loginData.name} (${loginData.email})`);
    } else {
      // Register temporary traveler
      const testEmail = `traveler_${Date.now()}@example.com`;
      const regRes = await fetch(`${BASE_API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Integration Test Traveler',
          phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
          email: testEmail,
          password: 'Password@123'
        })
      });
      const regData = await regRes.json();
      if (regRes.status === 201 && regData.token) {
        travelerToken = regData.token;
        pass('Traveler Registration', `Registered new test traveler: ${testEmail}`);
      } else {
        fail('Traveler Registration/Login', regData.error || `HTTP ${regRes.status}`);
      }
    }
  } catch (e) {
    fail('Traveler Auth', e.message);
  }

  if (travelerToken) {
    let createdBooking = null;
    // Create Booking
    try {
      const dayOffset = Math.floor(Math.random() * 60) + 10;
      const d1 = new Date(Date.now() + (60 + dayOffset) * 86400000).toISOString().split('T')[0];
      const d2 = new Date(Date.now() + (63 + dayOffset) * 86400000).toISOString().split('T')[0];
      const createRes = await fetch(`${BASE_API}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${travelerToken}`
        },
        body: JSON.stringify({
          homestay_id: 'gokarna-1',
          user_name: 'Integration Traveler',
          user_phone: '919876543210',
          check_in: d1,
          check_out: d2,
          guests_count: 2
        })
      });
      createdBooking = await createRes.json();
      if (createRes.status === 201 && createdBooking.id) {
        pass('POST /api/bookings', `Ref: ${createdBooking.reference_code}, Room: ${createdBooking.room_number}, Tariff: ₹${createdBooking.total_amount}`);
        if (createdBooking.guest_whatsapp_link && createdBooking.guest_whatsapp_link.includes('wa.me')) {
          pass('WhatsApp Guest Link', 'Correctly generated wa.me prefilled deep link');
        } else {
          fail('WhatsApp Guest Link', 'Missing guest_whatsapp_link in response');
        }
      } else {
        fail('POST /api/bookings', createdBooking.error || `HTTP ${createRes.status}`);
      }
    } catch (e) {
      fail('POST /api/bookings', e.message);
    }

    if (createdBooking && createdBooking.id) {
      // Initiate Payment (Razorpay order creation)
      try {
        const payRes = await fetch(`${BASE_API}/api/payments/${createdBooking.id}/initiate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${travelerToken}` }
        });
        const payData = await payRes.json();
        if (payRes.status === 201 && payData.order_id) {
          pass('POST /api/payments/:id/initiate', `Razorpay Order: ${payData.order_id}, Amount: ₹${payData.amount}`);
        } else {
          fail('POST /api/payments/:id/initiate', payData.error || `HTTP ${payRes.status}`);
        }
      } catch (e) {
        fail('POST /api/payments/:id/initiate', e.message);
      }

      // Test Payment Failed / Modal Dismissal
      try {
        const failRes = await fetch(`${BASE_API}/api/payments/${createdBooking.id}/fail`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${travelerToken}` }
        });
        const failData = await failRes.json();
        if (failRes.status === 200 && failData.payment_status === 'failed') {
          pass('POST /api/payments/:id/fail', 'Booking marked payment_status="failed"');
        } else {
          fail('POST /api/payments/:id/fail', failData.error || `HTTP ${failRes.status}`);
        }
      } catch (e) {
        fail('POST /api/payments/:id/fail', e.message);
      }

      // Check Booking Details by Ref
      try {
        const getRes = await fetch(`${BASE_API}/api/bookings/${createdBooking.reference_code}`, {
          headers: { Authorization: `Bearer ${travelerToken}` }
        });
        const getData = await getRes.json();
        if (getRes.status === 200 && getData.reference_code === createdBooking.reference_code) {
          pass('GET /api/bookings/:refCode', `Found booking, guest_whatsapp_link: ${Boolean(getData.guest_whatsapp_link)}`);
        } else {
          fail('GET /api/bookings/:refCode', getData.error || `HTTP ${getRes.status}`);
        }
      } catch (e) {
        fail('GET /api/bookings/:refCode', e.message);
      }
    }
  }

  // --- SECTION 6: META WHATSAPP TEMPLATES ---
  console.log('\n6. Checking Meta WhatsApp Cloud API Templates...');
  try {
    const version = process.env.WHATSAPP_API_VERSION || 'v22.0';
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const res = await fetch(`https://graph.facebook.com/${version}/${wabaId}/message_templates?fields=name,status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const approved = (data.data || []).filter(t => t.status === 'APPROVED').map(t => t.name);
    pass('Meta Cloud API', `Approved templates: ${approved.join(', ')}`);
  } catch (e) {
    fail('Meta Cloud API', e.message);
  }

  console.log('\n========================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED (Total: ${results.length})`);
  console.log('========================================\n');
}

runTests();
