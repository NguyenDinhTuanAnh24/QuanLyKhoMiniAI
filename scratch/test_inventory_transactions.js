// Test script for Inventory Transactions improvements
// Run with: node test_inventory_transactions.js
// Ensure backend server is running on http://localhost:5000

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testIntegrity() {
  const res = await fetch(`${API_BASE}/inventory/integrity-check`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log('Integrity check:', data);
}

async function testImport() {
  const payload = {
    type: 'IMPORT',
    items: [{ product_id: 'PROD001', quantity: 10, unit_price: 5000 }],
    note: 'Test import stock'
  };
  const res = await fetch(`${API_BASE}/inventory/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'test-import-123'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Import result:', data);
}

async function testExport() {
  const payload = {
    type: 'EXPORT',
    items: [{ product_id: 'PROD001', quantity: 5, unit_price: 5000 }],
    note: 'Test export stock'
  };
  const res = await fetch(`${API_BASE}/inventory/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'test-export-456'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Export result:', data);
}

async function testIdempotency() {
  const payload = {
    type: 'IMPORT',
    items: [{ product_id: 'PROD001', quantity: 3, unit_price: 5000 }],
    note: 'Idempotency test'
  };
  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': 'duplicate-key-789'
  };
  // First request
  const r1 = await fetch(`${API_BASE}/inventory/movements`, { method: 'POST', headers, body: JSON.stringify(payload) });
  const d1 = await r1.json();
  console.log('First request:', d1);
  // Duplicate request
  const r2 = await fetch(`${API_BASE}/inventory/movements`, { method: 'POST', headers, body: JSON.stringify(payload) });
  const d2 = await r2.json();
  console.log('Duplicate request:', d2);
}

(async () => {
  try {
    await testIntegrity();
    await testImport();
    await testExport();
    await testIdempotency();
  } catch (err) {
    console.error('Test error:', err);
  }
})();
