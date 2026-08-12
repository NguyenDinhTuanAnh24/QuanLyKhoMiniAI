const fs = require('fs');
const path = require('path');

// Sinh dữ liệu sản phẩm
const generateProducts = (count) => {
    const products = [];
    const categories = ['Đồ uống', 'Đồ ăn vặt', 'Gia vị', 'Đồ gia dụng', 'Chăm sóc cá nhân'];
    const units = ['Thùng', 'Hộp', 'Chai', 'Gói', 'Cái'];

    for (let i = 1; i <= count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const unit = units[Math.floor(Math.random() * units.length)];
        const price = Math.floor(Math.random() * 100) * 1000 + 5000;
        
        products.push({
            id: i,
            sku: `SP${String(i).padStart(4, '0')}`,
            name: `Sản phẩm mẫu ${i} - ${category}`,
            description: `Mô tả chi tiết cho sản phẩm mẫu ${i}. Đây là dữ liệu dùng để test dự báo AI và kiểm thử giao diện phân trang.`,
            category: category,
            unit: unit,
            price: price,
            import_price: Math.floor(price * 0.7),
            stock_quantity: Math.floor(Math.random() * 500) + 10,
            reorder_level: Math.floor(Math.random() * 50) + 10,
            supplier_id: Math.floor(Math.random() * 10) + 1,
            created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            status: 'ACTIVE'
        });
    }
    return products;
};

// Sinh dữ liệu đơn hàng
const generateOrders = (count, maxProducts) => {
    const orders = [];
    const statuses = ['COMPLETED', 'PENDING', 'CANCELLED'];
    const paymentMethods = ['CASH', 'TRANSFER', 'QR_PAYOS'];

    for (let i = 1; i <= count; i++) {
        const items = [];
        const numItems = Math.floor(Math.random() * 5) + 1;
        let total = 0;

        for (let j = 0; j < numItems; j++) {
            const qty = Math.floor(Math.random() * 10) + 1;
            const price = Math.floor(Math.random() * 50) * 1000 + 10000;
            total += qty * price;
            items.push({
                product_id: Math.floor(Math.random() * maxProducts) + 1,
                quantity: qty,
                unit_price: price,
                subtotal: qty * price
            });
        }

        orders.push({
            id: i,
            order_code: `ORD${String(i).padStart(5, '0')}`,
            customer_name: `Khách hàng ${i}`,
            customer_phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            total_amount: total,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            items: items,
            created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            created_by: Math.floor(Math.random() * 5) + 1
        });
    }
    return orders;
};

const run = () => {
    const seedersDir = __dirname;
    
    // Generate 150 products (~ 2000 lines of JSON)
    const products = generateProducts(150);
    fs.writeFileSync(path.join(seedersDir, 'mock_products.json'), JSON.stringify(products, null, 4), 'utf-8');
    
    // Generate 200 orders (~ 3000 lines of JSON)
    const orders = generateOrders(200, 150);
    fs.writeFileSync(path.join(seedersDir, 'mock_orders.json'), JSON.stringify(orders, null, 4), 'utf-8');
    
    console.log('Mock data generated successfully in database/seeders/');
};

run();
