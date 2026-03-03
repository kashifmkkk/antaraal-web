import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma, $Enums } from '@prisma/client';

const Role = $Enums.Role;

const MANAGEABLE_ROLES: $Enums.Role[] = [Role.ADMIN, Role.VENDOR, Role.BUYER];

export default function adminUsersRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      where: { role: { in: MANAGEABLE_ROLES } },
      orderBy: { name: 'asc' },
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastActiveAt: user.lastActiveAt,
      })),
    );
  });

  router.patch('/:id/role', async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { role } = req.body as { role?: $Enums.Role };
    if (!role || !MANAGEABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: 'invalid role' });
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: { role } });
    res.json({ id: updated.id, role: updated.role });
  });

  router.patch('/:id/status', async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { isActive } = req.body as { isActive?: boolean };
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive required' });
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: { isActive } });
    res.json({ id: updated.id, isActive: updated.isActive });
  });

  return router;
}
