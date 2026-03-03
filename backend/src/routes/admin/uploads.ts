import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Store uploads in the top-level backend/uploads directory so they are
// served by the express static handler configured in src/index.ts
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
console.log('[admin/uploads] storing files to', uploadsDir);

export default function adminUploadsRouter() {
  const router = Router();

  // Use a require-less import to avoid type issues when multer may not be installed.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const multer = require('multer');

  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_req: any, file: any, cb: any) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  });

  const upload = multer({ storage });

  router.post('/', upload.array('files', 20), async (req: Request, res: Response) => {
    const files = (req as any).files as Array<any> | undefined;
    if (!files || files.length === 0) return res.status(400).json({ error: 'no files uploaded' });

    const urls = files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  // Presigned upload endpoint (currently using local storage as fallback)
  // In production, replace this with S3 presigned URLs
  router.post('/presign', async (req: Request, res: Response) => {
    try {
      const { files } = req.body as { files?: Array<{ name: string; type: string; size: number }> };
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'files array required' });
      }

      // TODO: Replace with AWS S3 presigned URLs when AWS credentials are configured
      // For now, return a "not implemented" response so frontend falls back to POST upload
      // Uncomment below if you have AWS S3 configured:
      /*
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({ region: process.env.AWS_REGION });
      const bucket = process.env.AWS_S3_BUCKET;
      
      const uploads = await Promise.all(files.map(async (file) => {
        const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const params = { Bucket: bucket, Key: key, ContentType: file.type, Expires: 300 };
        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        const url = `https://${bucket}.s3.amazonaws.com/${key}`;
        return { uploadUrl, url, method: 'PUT', headers: { 'Content-Type': file.type } };
      }));
      
      return res.json({ uploads });
      */

      // For local dev: return 501 so frontend uses fallback
      return res.status(501).json({ error: 'presigned uploads not configured - use POST /api/admin/uploads' });
    } catch (e: any) {
      console.error('presign error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}
