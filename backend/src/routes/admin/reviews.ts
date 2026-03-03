import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { recalculateProductRating } from '../reviews';

export default function adminReviewsRouter(prisma: PrismaClient) {
  const router = Router();

  // List all reviews with filters
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { status, productId } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (productId) where.productId = Number(productId);

      const reviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json(reviews);
    } catch (e: any) {
      console.error('admin reviews list error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Approve review
  router.patch('/:id/approve', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'not found' });

      const updated = await prisma.review.update({
        where: { id },
        data: { status: 'Approved' },
      });

      // Recalculate product rating
      await recalculateProductRating(prisma, review.productId);

      res.json(updated);
    } catch (e: any) {
      console.error('admin review approve error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Reject review
  router.patch('/:id/reject', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'not found' });

      const updated = await prisma.review.update({
        where: { id },
        data: { status: 'Rejected' },
      });

      // Recalculate product rating (in case it was previously approved)
      await recalculateProductRating(prisma, review.productId);

      res.json(updated);
    } catch (e: any) {
      console.error('admin review reject error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Delete review
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'not found' });

      await prisma.review.delete({ where: { id } });

      // Recalculate product rating
      await recalculateProductRating(prisma, review.productId);

      res.json({ success: true });
    } catch (e: any) {
      console.error('admin review delete error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}
