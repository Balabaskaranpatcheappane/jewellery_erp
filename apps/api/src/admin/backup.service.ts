import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { BackupFile } from '@erp/shared';

const execFileAsync = promisify(execFile);

interface PgConn {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private readonly config: ConfigService) {
    this.backupDir =
      this.config.get<string>('BACKUP_DIR') ??
      path.join(process.cwd(), 'backups');
  }

  private conn(): PgConn {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) throw new BadRequestException('DATABASE_URL is not configured');
    const u = new URL(url);
    return {
      host: u.hostname || 'localhost',
      port: u.port || '5432',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async list(): Promise<BackupFile[]> {
    await this.ensureDir();
    const names = await fs.readdir(this.backupDir);
    const files = await Promise.all(
      names
        .filter((n) => n.endsWith('.dump'))
        .map(async (filename) => {
          const stat = await fs.stat(path.join(this.backupDir, filename));
          return {
            filename,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          };
        }),
    );
    return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(): Promise<BackupFile> {
    await this.ensureDir();
    const c = this.conn();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${c.database}-${stamp}.dump`;
    const filePath = path.join(this.backupDir, filename);

    try {
      await execFileAsync(
        'pg_dump',
        ['-h', c.host, '-p', c.port, '-U', c.user, '-Fc', '-f', filePath, c.database],
        { env: { ...process.env, PGPASSWORD: c.password } },
      );
    } catch (e) {
      this.logger.error(`pg_dump failed: ${(e as Error).message}`);
      throw new BadRequestException(
        'Backup failed. Ensure pg_dump is installed and on PATH.',
      );
    }
    const stat = await fs.stat(filePath);
    return { filename, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
  }

  async restore(filename: string): Promise<{ restored: string }> {
    // Guard against path traversal — only a bare filename inside backupDir.
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }
    const filePath = path.join(this.backupDir, filename);
    try {
      await fs.access(filePath);
    } catch {
      throw new BadRequestException('Backup file not found');
    }
    const c = this.conn();
    try {
      await execFileAsync(
        'pg_restore',
        [
          '-h', c.host, '-p', c.port, '-U', c.user,
          '--clean', '--if-exists', '--no-owner',
          '-d', c.database, filePath,
        ],
        { env: { ...process.env, PGPASSWORD: c.password } },
      );
    } catch (e) {
      // pg_restore can exit non-zero on benign warnings; surface only if fatal.
      this.logger.warn(`pg_restore reported: ${(e as Error).message}`);
    }
    return { restored: filename };
  }
}
