
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import cartRoutes from './routes/cart.routes.js';
import addressRoutes from './routes/address.routes.js';
import path from 'path';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// serve local images
app.use('/data/images', express.static(path.resolve('src/data/images')));

// mounts
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
