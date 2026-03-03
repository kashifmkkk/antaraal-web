import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

type InventoryPayload = {
  productId: string;
  name: string;
  category: string;
  categoryId?: number;
  vendor: string;
  availability: string;
  warrantyStatus: string;
  image?: string;
  photos?: string[];
  description?: string;
  price?: string;
  warranty?: string;
  status?: string;
};

export default function adminInventoryRouter(prisma: PrismaClient) {
  const router = Router();

  const mapProduct = (product: any) => ({
    id: String(product.id),
    productId: product.referenceCode ?? `PRD-${product.id}`,
    name: product.name,
    category: product.category,
    categoryId: product.categoryId,
    vendor: product.vendor ?? 'Unknown',
    availability: product.availability ?? 'On Request',
    warrantyStatus: product.warrantyStatus ?? 'Active',
    warranty: product.warranty ?? 'Standard',
    image: product.image ?? '/placeholder.svg',
    photos: product.photos ?? [],
    price: product.price ?? null,
    description: product.description ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });

  router.get('/', async (_req: Request, res: Response) => {
    const products = await prisma.product.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(products.map(mapProduct));
  });

  router.post('/', async (req: Request, res: Response) => {
    const {
      productId,
      name,
      category,
      categoryId,
      vendor,
      availability,
      warrantyStatus,
      image,
      photos,
      description,
      price,
      warranty,
      status,
    } =
      req.body as InventoryPayload;
    if (!productId || !name || !category || !vendor) {
      return res.status(400).json({ error: 'missing required fields' });
    }

    const product = await (prisma as any).product.create({
      data: {
        referenceCode: productId,
        name,
        category,
        categoryId: categoryId ?? null,
        vendor,
        availability,
        warrantyStatus,
        warranty: warranty ?? (warrantyStatus === 'Expired' ? 'Expired' : 'Standard'),
        // prefer last non-empty photo if provided, otherwise provided image
        image: (() => {
          const pics = (photos ?? []).filter(Boolean);
          if (pics.length > 0) return pics[pics.length - 1];
          return image ?? '/placeholder.svg';
        })(),
        photos: (photos ?? []).filter(Boolean),
        description: description ?? null,
        price: price ?? null,
        status: status ?? 'available',
      },
    });

    // Update category product count if categoryId is provided
    if (categoryId) {
      const count = await prisma.product.count({ where: { categoryId } });
      await prisma.category.update({ where: { id: categoryId }, data: { productCount: count } });
    }

    res.status(201).json(mapProduct(product));
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const {
      productId,
      name,
      category,
      categoryId,
      vendor,
      availability,
      warrantyStatus,
      image,
      photos,
      description,
      price,
      warranty,
      status,
    } =
      req.body as Partial<InventoryPayload>;

    const oldProduct = await prisma.product.findUnique({ where: { id: numericId } });
    const oldCategoryId = oldProduct?.categoryId;

    const updated = await (prisma as any).product.update({
      where: { id: numericId },
      data: {
        ...(productId ? { referenceCode: productId } : {}),
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(vendor ? { vendor } : {}),
        ...(availability ? { availability } : {}),
        ...(warrantyStatus ? { warrantyStatus } : {}),
        // if photos provided prefer last non-empty photo as image
        ...((photos && (photos as string[]).filter(Boolean).length > 0)
          ? { image: (photos as string[]).filter(Boolean).slice(-1)[0], photos: (photos as string[]).filter(Boolean) }
          : {}),
        ...(image ? { image } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(warranty ? { warranty } : {}),
        ...(status ? { status } : {}),
      },
    });

    // Update category product counts if category changed
    if (categoryId !== undefined && categoryId !== oldCategoryId) {
      if (oldCategoryId) {
        const oldCount = await prisma.product.count({ where: { categoryId: oldCategoryId } });
        await prisma.category.update({ where: { id: oldCategoryId }, data: { productCount: oldCount } });
      }
      if (categoryId) {
        const newCount = await prisma.product.count({ where: { categoryId } });
        await prisma.category.update({ where: { id: categoryId }, data: { productCount: newCount } });
      }
    }

    res.json(mapProduct(updated));
  });

  router.patch('/:id/availability', async (req: Request, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { availability } = req.body as { availability?: string };
    if (!availability) {
      return res.status(400).json({ error: 'availability required' });
    }

    const updated = await prisma.product.update({ where: { id: numericId }, data: { availability } });
    res.json(mapProduct(updated));
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    // Delete related cart items first to avoid foreign key constraint violation
    await prisma.cart.deleteMany({ where: { productId: numericId } });
    
    // Delete related orders, notifications, complaints, warranty records
    await prisma.notification.deleteMany({ where: { productId: numericId } });
    await prisma.complaint.deleteMany({ where: { productId: numericId } });
    await prisma.warrantyRecord.deleteMany({ where: { productId: numericId } });
    
    // Now delete the product
    await prisma.product.delete({ where: { id: numericId } });
    res.status(204).send();
  });

  return router;
}
