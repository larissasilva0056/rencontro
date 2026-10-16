import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Armazenamento de arquivos:
 *  - STORAGE_DRIVER=local (padrão): grava em ./uploads e serve em /uploads.
 *  - STORAGE_DRIVER=s3: qualquer serviço compatível com S3 (AWS S3, Cloudflare R2,
 *    Supabase Storage, Backblaze B2, MinIO...). O bucket precisa ter leitura pública
 *    (ou um CDN na frente) apontada por S3_PUBLIC_URL.
 */
@Injectable()
export class StorageService {
  private log = new Logger('Storage');
  private s3?: S3Client;
  private bucket = '';
  private publicBase = '';

  constructor() {
    if (process.env.STORAGE_DRIVER === 's3') {
      const { S3_BUCKET, S3_PUBLIC_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
      if (!S3_BUCKET || !S3_PUBLIC_URL || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY)
        throw new Error('STORAGE_DRIVER=s3 exige S3_BUCKET, S3_PUBLIC_URL, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY.');
      this.bucket = S3_BUCKET;
      this.publicBase = S3_PUBLIC_URL.replace(/\/$/, '');
      this.s3 = new S3Client({
        region: process.env.S3_REGION ?? 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
      });
      this.log.log(`Armazenamento em nuvem (bucket ${this.bucket}).`);
    } else {
      mkdirSync('uploads', { recursive: true });
      this.log.log('Armazenamento local (./uploads).');
    }
  }

  async saveImage(buffer: Buffer, ext: '.jpg' | '.png', mimetype: string): Promise<string> {
    const name = randomUUID() + ext;
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: `cases/${name}`, Body: buffer, ContentType: mimetype, CacheControl: 'public, max-age=31536000, immutable' }));
      return `${this.publicBase}/cases/${name}`;
    }
    await writeFile(join('uploads', name), buffer);
    return `/uploads/${name}`;
  }
}
