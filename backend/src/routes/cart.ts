import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

export default function cartRouter(prisma: PrismaClient, requireAuth: RequestHandler) {
  const router = Router();
  router.use(requireAuth);

  // Get user's cart
  router.get("/", async (req, res) => {
    try {
      const userId = req.auth?.userId;

      const cartItems = await prisma.cart.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              availability: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(cartItems);
    } catch (error) {
      console.error("[GET /api/cart] Error:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  // Add item to cart
  router.post("/", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      // Check if item already exists in cart
      const existing = await prisma.cart.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: parseInt(productId),
          },
        },
      });

      if (existing) {
        // Update quantity
        const updated = await prisma.cart.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
        return res.json(updated);
      }

      // Create new cart item
      const cartItem = await prisma.cart.create({
        data: {
          userId,
          productId: parseInt(productId),
          quantity,
        },
      });

      res.json(cartItem);
    } catch (error) {
      console.error("[POST /api/cart] Error:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  // Clear entire cart (define before '/:id' to avoid being captured)
  router.delete("/clear", async (req, res) => {
    try {
      const userId = req.auth?.userId!;

      await prisma.cart.deleteMany({
        where: { userId },
      });

      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("[DELETE /api/cart/clear] Error:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Update cart item quantity
  router.patch("/:id", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      // Verify ownership
      const cartItem = await prisma.cart.findFirst({
        where: {
          id: parseInt(id),
          userId,
        },
      });

      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      const updated = await prisma.cart.update({
        where: { id: parseInt(id) },
        data: { quantity },
      });

      res.json(updated);
    } catch (error) {
      console.error("[PATCH /api/cart/:id] Error:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  router.delete("/:id", async (req, res) => {
    try {
      const userId = req.auth?.userId!;
      const { id } = req.params;

      // Verify ownership
      const cartItem = await prisma.cart.findFirst({
        where: {
          id: parseInt(id),
          userId,
        },
      });

      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      await prisma.cart.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("[DELETE /api/cart/:id] Error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  return router;
}
