import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import productsRouter from './routes/products';
import vendorsRouter from './routes/vendors';
import rfqRouter from './routes/rfqs';
import authRouter from './routes/auth';
import quotesRouter from './routes/quotes';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import warrantyClaimsRouter from './routes/warranty-claims';
import notificationsRouter from './routes/notifications';
import reviewsRouter from './routes/reviews';
import categoriesRouter from './routes/categories';
import registerAdminRoutes from './routes/admin';
import { createAuthGuard } from './middleware/auth';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const { requireAuth } = createAuthGuard(prisma);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// CORS: allow frontend origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'https://antaraalspace.com',
  'https://www.antaraalspace.com',
  'http://antaraalspace.com',
  'http://www.antaraalspace.com',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now; tighten later
    }
  },
  credentials: true,
}));
app.use(express.json());

// Public vendor registration: creates Vendor and associated VENDOR user
app.post('/api/vendors/register', async (req, res) => {
  try {
    const { vendorName, name, email, password, location, specialty, certifications } = req.body as any;
    if (!vendorName || !name || !email || !password) {
      return res.status(400).json({ error: 'vendorName,name,email,password required' });
    }

    const Role = $Enums.Role;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'email exists' });

    const existingVendor = await prisma.vendor.findUnique({ where: { name: vendorName } });
    if (existingVendor) return res.status(400).json({ error: 'vendor exists' });

    const hash = await bcrypt.hash(password, 10);
    const vendor = await prisma.vendor.create({ data: { name: vendorName, location, specialty, certifications: certifications ?? [] } });
    const user = await prisma.user.create({ data: { name, email, passwordHash: hash, role: Role.VENDOR, vendorId: vendor.id } });

    const token = jwt.sign({ userId: user.id, role: user.role, vendorId: vendor.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, vendorId: vendor.id } });
  } catch (e: any) {
    console.error('vendor register error', e);
    res.status(500).json({ error: e?.message ?? 'server error' });

  }
});

// Serve uploaded files from backend/uploads at /uploads
const staticUploadsPath = path.join(__dirname, '..', 'uploads');
console.log('[server] serving static uploads from', staticUploadsPath);
app.use('/uploads', express.static(staticUploadsPath));

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter(prisma));
// Public product listings do not require authentication
app.use('/api/products', productsRouter(prisma));
app.use('/api/categories', categoriesRouter(prisma));
app.use('/api/vendors', requireAuth, vendorsRouter(prisma));
app.use('/api/rfqs', requireAuth, rfqRouter(prisma));
app.use('/api/quotes', requireAuth, quotesRouter(prisma));
app.use('/api/cart', cartRouter(prisma, requireAuth));
app.use('/api/orders', ordersRouter(prisma, requireAuth));
app.use('/api/warranty-claims', warrantyClaimsRouter(prisma, requireAuth));
app.use('/api/warranties', warrantyClaimsRouter(prisma, requireAuth));
app.use('/api/notifications', requireAuth, notificationsRouter(prisma));
app.use('/api/reviews', reviewsRouter(prisma, requireAuth));
app.use('/api/admin', registerAdminRoutes(prisma, requireAuth));


app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
