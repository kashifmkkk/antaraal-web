import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

export default function ordersRouter(prisma: PrismaClient, requireAuth: RequestHandler) {
  const router = Router();
  router.use(requireAuth);

  // Get user's orders
  router.get("/", async (req, res) => {
    try {
      const userId = req.auth?.userId!;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("[GET /api/orders] Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

  // Create new order from cart
  router.post("/", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
    const { shippingAddress, billingAddress, paymentMethod = "COD" } = req.body;

    // Get cart items
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = cartItems.map((item) => {
      const price = parseFloat(item.product.price || "0");
      totalAmount += price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
      };
    });

    // Add 18% GST
    totalAmount = totalAmount * 1.18;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${userId}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        shippingAddress,
        billingAddress,
        paymentMethod,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Clear cart
    await prisma.cart.deleteMany({
      where: { userId },
    });

    res.json(order);
  } catch (error) {
    console.error("[POST /api/orders] Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

  // Get order by ID
  router.get("/:id", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("[GET /api/orders/:id] Error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  return router;
}
