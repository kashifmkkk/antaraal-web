import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma, $Enums } from '@prisma/client';

export const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

const Role = $Enums.Role;

export interface AuthClaims {
  userId: number;
  role: $Enums.Role;
  vendorId?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

const extractBearerToken = (header?: string) => {
  if (!header) return null;
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
};

export function createAuthGuard(prisma: PrismaClient) {
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization as string | undefined);
    if (!token) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthClaims;
      if (!payload.userId || !payload.role) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          role: true,
          isActive: true,
          vendor: { select: { id: true } },
        },
      });

      if (!user || !user.isActive) {
        return res.status(403).json({ error: 'forbidden' });
      }

      req.auth = {
        userId: user.id,
        role: user.role,
        vendorId: user.vendor?.id ?? undefined,
      };

      await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

      next();
    } catch (error) {
      return res.status(401).json({ error: 'invalid token' });
    }
  };

  return { requireAuth };
}

export function requireRole(...allowed: $Enums.Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!allowed.includes(auth.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    next();
  };
}

export const isAdmin = (req: Request) => req.auth?.role === Role.ADMIN;
export const isVendor = (req: Request) => req.auth?.role === Role.VENDOR;
