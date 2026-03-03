import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, requireRole } from '../../middleware/auth';

const Role = $Enums.Role;

export default function adminAuthRouter(prisma: PrismaClient, requireAuth: RequestHandler) {
  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const admin = await prisma.user.findUnique({ where: { email } });
    if (!admin || admin.role !== Role.ADMIN || !admin.isActive) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    await prisma.user.update({ where: { id: admin.id }, data: { lastActiveAt: new Date() } });

    const token = jwt.sign({ userId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '12h' });

    return res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  });

  router.get('/me', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
    const adminId = req.auth?.userId;
    if (!adminId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      return res.status(404).json({ error: 'admin not found' });
    }

    return res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  });

  router.post('/logout', requireAuth, requireRole(Role.ADMIN), (_req: Request, res: Response) => {
    return res.status(204).send();
  });

  return router;
}
