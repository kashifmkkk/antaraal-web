import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';

export default function categoriesRouter(prisma: PrismaClient) {
  const router = Router();

  // Get all categories
  router.get('/', async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get single category
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            take: 20,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  // Get products by category slug
  router.get('/slug/:slug/products', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category.products);
    } catch (error) {
      console.error('Error fetching category products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  return router;
}
