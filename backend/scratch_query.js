const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:\\ĐATN_KHOHANGMINI\\backend\\.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: orderData, error: orderErr } = await supabase.from('orders')
    .select('order_id, created_at, order_items(product_id, quantity)')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
  
  if (orderErr) {
    console.error('Order Err:', orderErr);
    return;
  }
  
  console.log('Orders in 90 days:', orderData?.length);
  
  let salesByProduct = {};
  orderData.forEach(o => {
    o.order_items.forEach(oi => {
      salesByProduct[oi.product_id] = (salesByProduct[oi.product_id] || 0) + oi.quantity;
    });
  });
  
  const soldProducts = Object.keys(salesByProduct).length;
  console.log('Products sold in 90 days:', soldProducts);
  console.log('Products with >= 90 sales (1/day):', Object.values(salesByProduct).filter(v => v >= 90).length);
  console.log('Products with < 18 sales (< 0.2/day):', Object.values(salesByProduct).filter(v => v < 18).length);
  console.log('Sample salesByProduct:', Object.entries(salesByProduct).slice(0, 5));
}

run().catch(console.error);
