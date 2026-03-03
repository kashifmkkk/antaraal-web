import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function adminAnalyticsRouter(prisma: PrismaClient) {
  const router = Router();

  // Get dashboard analytics
  router.get('/', async (req: Request, res: Response) => {
    try {
      // Sales metrics
      const totalOrders = await prisma.order.count();
      const totalRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
      });
      
      const pendingOrders = await prisma.order.count({
        where: { status: 'Pending' },
      });

      const deliveredOrders = await prisma.order.count({
        where: { status: 'Delivered' },
      });

      // Recent orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrders = await prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      });

      const recentRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      });

      // Popular products (by order count)
      const orderItems = await prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { productId: true },
        _sum: { quantity: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      });

      const popularProductIds = orderItems.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: popularProductIds } },
        select: { id: true, name: true, category: true, image: true, price: true },
      });

      const popularProducts = orderItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...product,
          orderCount: item._count.productId,
          totalQuantity: item._sum.quantity || 0,
        };
      });

      // Top vendors by product count
      const vendorProducts = await prisma.product.groupBy({
        by: ['vendor'],
        _count: { vendor: true },
        where: { vendor: { not: null } },
        orderBy: { _count: { vendor: 'desc' } },
        take: 10,
      });

      // User activity
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          lastActiveAt: { gte: thirtyDaysAgo },
        },
      });

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      });

      // RFQ and Quote metrics
      const totalRFQs = await prisma.rFQ.count();
      const rfqsByStatus = await prisma.rFQ.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      const totalQuotes = await prisma.quote.count();
      const quotesByStatus = await prisma.quote.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      // Reviews
      const totalReviews = await prisma.review.count();
      const pendingReviews = await prisma.review.count({
        where: { status: 'Pending' },
      });

      const reviewsByStatus = await prisma.review.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      // Average order value
      const avgOrderValue = totalOrders > 0 
        ? (totalRevenue._sum.totalAmount || 0) / totalOrders 
        : 0;

      // Conversion rate (RFQs to Orders)
      const conversionRate = totalRFQs > 0 
        ? ((totalOrders / totalRFQs) * 100).toFixed(2)
        : '0.00';

      res.json({
        sales: {
          totalOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          pendingOrders,
          deliveredOrders,
          recentOrders,
          recentRevenue: recentRevenue._sum.totalAmount || 0,
        },
        products: {
          popular: popularProducts,
        },
        vendors: {
          top: vendorProducts,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole,
        },
        rfqs: {
          total: totalRFQs,
          byStatus: rfqsByStatus,
        },
        quotes: {
          total: totalQuotes,
          byStatus: quotesByStatus,
          conversionRate,
        },
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
          byStatus: reviewsByStatus,
        },
      });
    } catch (e: any) {
      console.error('analytics error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Get revenue chart data (last 12 months)
  router.get('/revenue-chart', async (req: Request, res: Response) => {
    try {
      const chartData = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const orders = await prisma.order.aggregate({
          _sum: { totalAmount: true },
          _count: { id: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        chartData.push({
          month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: orders._sum.totalAmount || 0,
          orders: orders._count.id,
        });
      }

      res.json(chartData);
    } catch (e: any) {
      console.error('revenue chart error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Get top customers by revenue and order count
  router.get('/top-customers', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Get orders grouped by user
      const ordersByUser = await prisma.order.groupBy({
        by: ['userId'],
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: limit,
      });

      // Get user details
      const userIds = ordersByUser.map(o => o.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true },
      });

      const topCustomers = ordersByUser.map(order => {
        const user = users.find(u => u.id === order.userId);
        return {
          userId: order.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          role: user?.role || '',
          totalRevenue: order._sum.totalAmount || 0,
          orderCount: order._count.id,
        };
      });

      res.json(topCustomers);
    } catch (e: any) {
      console.error('top customers error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Get top vendors by product sales
  router.get('/top-vendors', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Get all order items
      const orderItems = await prisma.orderItem.findMany();

      // Get all products
      const productIds = [...new Set(orderItems.map(item => item.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, vendor: true },
      });

      // Create a map for quick product lookup
      const productMap = new Map(products.map(p => [p.id, p]));

      // Group by vendor and calculate totals
      const vendorStats = new Map<string, { revenue: number; orderCount: number; productCount: number }>();
      
      for (const item of orderItems) {
        const product = productMap.get(item.productId);
        const vendor = product?.vendor || 'Unknown';
        const stats = vendorStats.get(vendor) || { revenue: 0, orderCount: 0, productCount: 0 };
        stats.revenue += item.price * item.quantity;
        stats.orderCount += 1;
        vendorStats.set(vendor, stats);
      }

      // Get product count per vendor
      const vendorProducts = await prisma.product.groupBy({
        by: ['vendor'],
        _count: { id: true },
        where: { vendor: { not: null } },
      });

      for (const vp of vendorProducts) {
        if (vp.vendor) {
          const stats = vendorStats.get(vp.vendor) || { revenue: 0, orderCount: 0, productCount: 0 };
          stats.productCount = vp._count.id;
          vendorStats.set(vp.vendor, stats);
        }
      }

      // Convert to array and sort by revenue
      const topVendors = Array.from(vendorStats.entries())
        .map(([vendor, stats]) => ({
          vendor,
          totalRevenue: Math.round(stats.revenue * 100) / 100,
          orderCount: stats.orderCount,
          productCount: stats.productCount,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      res.json(topVendors);
    } catch (e: any) {
      console.error('top vendors error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Get revenue by category
  router.get('/revenue-by-category', async (req: Request, res: Response) => {
    try {
      // Get all order items
      const orderItems = await prisma.orderItem.findMany();

      // Get all products
      const productIds = [...new Set(orderItems.map(item => item.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true },
      });

      // Create a map for quick product lookup
      const productMap = new Map(products.map(p => [p.id, p]));

      // Group by category and calculate revenue
      const categoryStats = new Map<string, { revenue: number; orderCount: number }>();
      
      for (const item of orderItems) {
        const product = productMap.get(item.productId);
        const category = product?.category || 'Uncategorized';
        const stats = categoryStats.get(category) || { revenue: 0, orderCount: 0 };
        stats.revenue += item.price * item.quantity;
        stats.orderCount += 1;
        categoryStats.set(category, stats);
      }

      // Convert to array and sort by revenue
      const revenueByCategory = Array.from(categoryStats.entries())
        .map(([category, stats]) => ({
          category,
          revenue: Math.round(stats.revenue * 100) / 100,
          orderCount: stats.orderCount,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      res.json(revenueByCategory);
    } catch (e: any) {
      console.error('revenue by category error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Get conversion funnel data
  router.get('/conversion-funnel', async (req: Request, res: Response) => {
    try {
      // Count users (potential customers)
      const totalUsers = await prisma.user.count({
        where: { role: { not: 'ADMIN' } },
      });

      // Count RFQs (initial interest)
      const totalRFQs = await prisma.rFQ.count();

      // Count quotes sent (vendor response)
      const totalQuotes = await prisma.quote.count();

      // Count accepted quotes
      const acceptedQuotes = await prisma.quote.count({
        where: { status: 'Accepted' },
      });

      // Count cart items (added to cart)
      const usersWithCart = await prisma.cart.groupBy({
        by: ['userId'],
        _count: { userId: true },
      });

      // Count completed orders
      const totalOrders = await prisma.order.count();
      const completedOrders = await prisma.order.count({
        where: { status: { in: ['Delivered', 'Completed'] } },
      });

      // Calculate conversion rates
      const rfqConversionRate = totalUsers > 0 ? (totalRFQs / totalUsers) * 100 : 0;
      const quoteConversionRate = totalRFQs > 0 ? (totalQuotes / totalRFQs) * 100 : 0;
      const cartConversionRate = totalQuotes > 0 ? (usersWithCart.length / totalQuotes) * 100 : 0;
      const orderConversionRate = usersWithCart.length > 0 ? (totalOrders / usersWithCart.length) * 100 : 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      const funnelData = [
        {
          stage: 'Users',
          count: totalUsers,
          percentage: 100,
          conversionFromPrevious: 100,
        },
        {
          stage: 'RFQs Submitted',
          count: totalRFQs,
          percentage: rfqConversionRate,
          conversionFromPrevious: rfqConversionRate,
        },
        {
          stage: 'Quotes Received',
          count: totalQuotes,
          percentage: (totalQuotes / totalUsers) * 100,
          conversionFromPrevious: quoteConversionRate,
        },
        {
          stage: 'Items in Cart',
          count: usersWithCart.length,
          percentage: (usersWithCart.length / totalUsers) * 100,
          conversionFromPrevious: cartConversionRate,
        },
        {
          stage: 'Orders Placed',
          count: totalOrders,
          percentage: (totalOrders / totalUsers) * 100,
          conversionFromPrevious: orderConversionRate,
        },
        {
          stage: 'Orders Completed',
          count: completedOrders,
          percentage: (completedOrders / totalUsers) * 100,
          conversionFromPrevious: completionRate,
        },
      ];

      res.json({
        funnel: funnelData,
        summary: {
          overallConversion: totalUsers > 0 ? (completedOrders / totalUsers) * 100 : 0,
          totalUsers,
          totalOrders,
          completedOrders,
        },
      });
    } catch (e: any) {
      console.error('conversion funnel error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}
