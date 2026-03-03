import { PrismaClient, $Enums } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { createAuthGuard, requireRole } from '../middleware/auth';

export default function productsRouter(prisma: PrismaClient) {
  const router = Router();
  const Role = $Enums.Role;
  const { requireAuth } = createAuthGuard(prisma);

  router.get('/', async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({ 
      orderBy: { id: 'asc' },
      include: { categoryModel: true }
    });
    res.json(products);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { categoryModel: true }
    });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  });

  // Vendors may submit products for admin approval
  router.post('/', requireAuth, requireRole(Role.VENDOR), async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth || !auth.vendorId) return res.status(403).json({ error: 'vendor account required' });

    const { name, category, categoryId, image, description, referenceCode, price, availability, warranty } = req.body as any;
    if (!name || !category) return res.status(400).json({ error: 'name and category required' });

    const vendor = await prisma.vendor.findUnique({ where: { id: auth.vendorId } });

    const product = await prisma.product.create({
      data: {
        name,
        category,
        categoryId: categoryId ?? null,
        image: image ?? '/placeholder.svg',
        description: description ?? null,
        referenceCode: referenceCode ?? null,
        vendor: vendor?.name ?? 'Unknown Vendor',
        price: price ?? null,
        availability: availability ?? 'On Request',
        warranty: warranty ?? null,
        warrantyStatus: 'Active',
        status: 'pending',
      },
    });

    // Update category product count if categoryId is provided
    if (categoryId) {
      const count = await prisma.product.count({ where: { categoryId } });
      await prisma.category.update({ where: { id: categoryId }, data: { productCount: count } });
    }

    res.status(201).json(product);
  });

  return router;
}
