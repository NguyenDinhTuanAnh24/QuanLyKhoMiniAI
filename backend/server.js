require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GlobalExceptionHandler } = require('./src/middleware/errorHandler');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/suppliers', supplierRoutes);

// Error Handling Middleware
app.use(GlobalExceptionHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
