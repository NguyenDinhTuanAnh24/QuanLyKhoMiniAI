require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GlobalExceptionHandler } = require('./src/middleware/errorHandler');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const userRoutes = require('./src/routes/userRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const authRoutes = require('./src/routes/authRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const activityLogRoutes = require('./src/routes/activityLogRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);


// Error Handling Middleware
app.use(GlobalExceptionHandler);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nLỖI: Cổng ${PORT} đang được sử dụng bởi một tiến trình khác.`);
      console.error('Vui lòng tắt tiến trình cũ hoặc khởi động lại máy.\n');
      process.exit(1);
    } else {
      console.error('Lỗi khi khởi động server:', error);
      process.exit(1);
    }
  });
}

module.exports = app;
