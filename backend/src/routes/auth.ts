import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

const Role = $Enums.Role;

export default function authRouter(prisma: PrismaClient) {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) return res.status(400).json({ error: 'name,email,password required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'email exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash: hash, role: Role.BUYER } });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, vendorId: null } });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'email,password required' });
    const user = await prisma.user.findUnique({ where: { email }, include: { vendor: { select: { id: true } } } });
    if (!user || !user.isActive) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const vendorId = user.vendor?.id ?? undefined;
    const token = jwt.sign({ userId: user.id, role: user.role, vendorId }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: user.vendor?.id ?? null,
      },
    });
  });

  router.get('/me', async (req: Request, res: Response) => {
    const auth = req.headers.authorization as string | undefined;
    if (!auth) return res.status(401).json({ error: 'no auth' });
    const token = auth.replace('Bearer ', '');
    try {
      const payload: any = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          vendor: { select: { id: true } },
        },
      });
      if (!user) return res.status(404).json({ error: 'not found' });
      if (!user.isActive) return res.status(403).json({ error: 'inactive' });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, vendorId: user.vendor?.id ?? null });
    } catch (e) {
      res.status(401).json({ error: 'invalid token' });
    }
  });

  return router;
}
