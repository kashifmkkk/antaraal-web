import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

type SettingsPayload = {
  notificationEmail: string;
  rfqAutoAssign: boolean;
  dailyDigest: boolean;
  complianceNotes: string;
};

export default function adminSettingsRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const settings = await prisma.adminSetting.upsert({
      where: { id: 1 },
      update: {},
      create: {},
    });

    res.json(settings);
  });

  router.put('/', async (req: Request, res: Response) => {
    const payload = req.body as SettingsPayload;
    if (!payload.notificationEmail) {
      return res.status(400).json({ error: 'notificationEmail required' });
    }

    const settings = await prisma.adminSetting.update({
      where: { id: 1 },
      data: {
        notificationEmail: payload.notificationEmail,
        rfqAutoAssign: payload.rfqAutoAssign,
        dailyDigest: payload.dailyDigest,
        complianceNotes: payload.complianceNotes,
      },
    });

    res.json(settings);
  });

  return router;
}
