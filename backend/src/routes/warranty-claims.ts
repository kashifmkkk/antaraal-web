import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

export default function warrantyClaimsRouter(prisma: PrismaClient, requireAuth: RequestHandler) {
  const router = Router();
  router.use(requireAuth);

  // Get user's warranty claims
  router.get("/", async (req, res) => {
    try {
      const userId = req.auth?.userId!;

    const claims = await prisma.warrantyClaim.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(claims);
  } catch (error) {
    console.error("[GET /api/warranty-claims] Error:", error);
    res.status(500).json({ error: "Failed to fetch warranty claims" });
  }
});

  // Create new warranty claim
  router.post("/", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
    const { productId, recordId, subject, description } = req.body;

    if (!productId || !subject) {
      return res.status(400).json({ error: "Product ID and subject are required" });
    }

    const claim = await prisma.warrantyClaim.create({
      data: {
        userId,
        productId: parseInt(productId),
        recordId: recordId ? parseInt(recordId) : null,
        subject,
        description,
      },
    });

    res.json(claim);
  } catch (error) {
    console.error("[POST /api/warranty-claims] Error:", error);
    res.status(500).json({ error: "Failed to create warranty claim" });
  }
});

  // Get user's warranties
  router.get("/my", async (req, res) => {
    try {
      const userId = req.auth?.userId!;

    // Get warranties for products the user has ordered
    const userOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
    });

    const productIds = userOrders.flatMap((order) =>
      order.items.map((item) => item.productId)
    );

    const warranties = await prisma.warrantyRecord.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        product: true,
        vendor: true,
      },
    });

    const formattedWarranties = warranties.map((w) => ({
      id: w.id,
      productName: w.product.name,
      vendor: w.vendor?.name || "Unknown",
      tailNumber: w.tailNumber,
      expiryDate: w.expiryDate,
      status: w.status,
    }));

    res.json(formattedWarranties);
  } catch (error) {
    console.error("[GET /api/warranties/my] Error:", error);
    res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  return router;
}
