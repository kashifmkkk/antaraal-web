import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export default function adminWarrantyClaimsRouter(prisma: PrismaClient) {
  const router = Router();

  // Get all warranty claims (admin)
  router.get("/", async (req, res) => {
  try {
    const claims = await prisma.warrantyClaim.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(claims);
  } catch (error) {
    console.error("[GET /api/admin/warranty-claims] Error:", error);
    res.status(500).json({ error: "Failed to fetch warranty claims" });
  }
});

  // Get warranty claim by ID (admin)
  router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: parseInt(id) },
    });

    if (!claim) {
      return res.status(404).json({ error: "Warranty claim not found" });
    }

    res.json(claim);
  } catch (error) {
    console.error("[GET /api/admin/warranty-claims/:id] Error:", error);
    res.status(500).json({ error: "Failed to fetch warranty claim" });
  }
});

  // Update warranty claim (admin)
  router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (response !== undefined) updateData.response = response;

    const updated = await prisma.warrantyClaim.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/warranty-claims/:id] Error:", error);
    res.status(500).json({ error: "Failed to update warranty claim" });
  }
});

  // Delete warranty claim (admin)
  router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.warrantyClaim.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Warranty claim deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/admin/warranty-claims/:id] Error:", error);
    res.status(500).json({ error: "Failed to delete warranty claim" });
    }
  });

  return router;
}
