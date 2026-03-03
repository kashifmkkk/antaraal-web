import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export default function adminOrdersRouter(prisma: PrismaClient) {
  const router = Router();

  // Get all orders (admin)
  router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("[GET /api/admin/orders] Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

  // Get order by ID (admin)
  router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("[GET /api/admin/orders/:id] Error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

  // Update order status (admin)
  router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, trackingNumber, shippingCarrier } = req.body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      
      // Auto-set timestamps based on status
      if (status === 'Shipped' && !updateData.shippedAt) {
        updateData.shippedAt = new Date();
      }
      if (status === 'Delivered' && !updateData.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier;

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        items: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/orders/:id] Error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

  // Delete order (admin)
  router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete order items first
    await prisma.orderItem.deleteMany({
      where: { orderId: parseInt(id) },
    });

    // Delete order
    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/admin/orders/:id] Error:", error);
    res.status(500).json({ error: "Failed to delete order" });
    }
  });

  return router;
}
