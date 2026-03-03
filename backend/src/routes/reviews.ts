import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function reviewsRouter(prisma: PrismaClient, requireAuth: any) {
  const router = Router();

  // Get reviews for a product (public)
  router.get('/product/:productId', async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.productId);
      if (Number.isNaN(productId)) return res.status(400).json({ error: 'invalid id' });

      const reviews = await prisma.review.findMany({
        where: { 
          productId,
          status: 'Approved' 
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(reviews);
    } catch (e: any) {
      console.error('reviews list error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Create a review (authenticated users only)
  router.post('/', requireAuth, async (req: any, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: 'unauthorized' });

      const { productId, rating, comment } = req.body;
      
      if (!productId || !rating) {
        return res.status(400).json({ error: 'productId and rating required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating must be between 1 and 5' });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ error: 'product not found' });

      // Check if user already reviewed this product
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          userId: auth.userId,
        },
      });

      if (existingReview) {
        return res.status(400).json({ error: 'you have already reviewed this product' });
      }

      // Get user info
      const user = await prisma.user.findUnique({ 
        where: { id: auth.userId },
        select: { name: true }
      });

      // Create review
      const review = await prisma.review.create({
        data: {
          productId,
          userId: auth.userId,
          userName: user?.name || 'Anonymous',
          rating,
          comment: comment || null,
          status: 'Pending',
        },
      });

      res.status(201).json(review);
    } catch (e: any) {
      console.error('review create error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Update review (user can edit their own pending review)
  router.patch('/:id', requireAuth, async (req: any, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: 'unauthorized' });

      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'not found' });

      // Only allow user to edit their own pending review
      if (review.userId !== auth.userId) {
        return res.status(403).json({ error: 'forbidden' });
      }

      if (review.status !== 'Pending') {
        return res.status(400).json({ error: 'cannot edit approved or rejected review' });
      }

      const { rating, comment } = req.body;
      
      const updated = await prisma.review.update({
        where: { id },
        data: {
          ...(rating && { rating }),
          ...(comment !== undefined && { comment }),
        },
      });

      res.json(updated);
    } catch (e: any) {
      console.error('review update error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Delete review (user can delete their own review)
  router.delete('/:id', requireAuth, async (req: any, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: 'unauthorized' });

      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'not found' });

      // Only allow user to delete their own review
      if (review.userId !== auth.userId && auth.role !== 'ADMIN') {
        return res.status(403).json({ error: 'forbidden' });
      }

      await prisma.review.delete({ where: { id } });

      // Recalculate product rating
      await recalculateProductRating(prisma, review.productId);

      res.json({ success: true });
    } catch (e: any) {
      console.error('review delete error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}

// Helper function to recalculate product rating
async function recalculateProductRating(prisma: PrismaClient, productId: number) {
  const approvedReviews = await prisma.review.findMany({
    where: {
      productId,
      status: 'Approved',
    },
    select: { rating: true },
  });

  if (approvedReviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { 
        rating: null,
        reviewCount: 0,
      },
    });
  } else {
    const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
    await prisma.product.update({
      where: { id: productId },
      data: { 
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: approvedReviews.length,
      },
    });
  }
}

export { recalculateProductRating };
