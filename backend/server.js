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
const reportRoutes = require('./src/routes/reportRoutes');

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
app.use('/api/reports', reportRoutes);

// Error Handling Middleware
app.use(GlobalExceptionHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
