import { PrismaClient, $Enums } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { createAuthGuard, requireRole } from '../../middleware/auth';

export default function adminCategoriesRouter(prisma: PrismaClient) {
  const router = Router();
  const Role = $Enums.Role;
  const { requireAuth } = createAuthGuard(prisma);

  // All routes require admin authentication
  router.use(requireAuth, requireRole(Role.ADMIN));

  // Get all categories (including inactive)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
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
          _count: {
            select: { products: true }
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

  // Create new category
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, slug, description } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      // Check if category with same name or slug exists
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { name },
            { slug }
          ]
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Category with this name or slug already exists' });
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description: description || null,
          productCount: 0,
          isActive: true
        }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Update category
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name, slug, description, isActive } = req.body;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) return res.status(404).json({ error: 'Category not found' });

      // Check if new name/slug conflicts with existing categories (excluding current)
      if (name || slug) {
        const existing = await prisma.category.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  name ? { name } : {},
                  slug ? { slug } : {}
                ]
              }
            ]
          }
        });

        if (existing) {
          return res.status(400).json({ error: 'Category with this name or slug already exists' });
        }
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Delete category
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!category) return res.status(404).json({ error: 'Category not found' });

      // Check if category has products
      if (category._count.products > 0) {
        return res.status(400).json({ 
          error: `Cannot delete category with ${category._count.products} products. Please reassign or remove products first.` 
        });
      }

      await prisma.category.delete({ where: { id } });
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Update product count for a category
  router.post('/:id/update-count', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      const count = await prisma.product.count({
        where: { categoryId: id }
      });

      const category = await prisma.category.update({
        where: { id },
        data: { productCount: count }
      });

      res.json(category);
    } catch (error) {
      console.error('Error updating category count:', error);
      res.status(500).json({ error: 'Failed to update category count' });
    }
  });

  // Assign product to category
  router.post('/:id/assign-product', async (req: Request, res: Response) => {
    try {
      const categoryId = Number(req.params.id);
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) return res.status(404).json({ error: 'Category not found' });

      const product = await prisma.product.update({
        where: { id: productId },
        data: { categoryId }
      });

      // Update product count
      const count = await prisma.product.count({
        where: { categoryId }
      });

      await prisma.category.update({
        where: { id: categoryId },
        data: { productCount: count }
      });

      res.json(product);
    } catch (error) {
      console.error('Error assigning product to category:', error);
      res.status(500).json({ error: 'Failed to assign product' });
    }
  });

  return router;
}
