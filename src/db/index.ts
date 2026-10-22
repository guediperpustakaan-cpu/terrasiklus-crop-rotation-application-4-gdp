import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PoolClient, QueryResult } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __terraSiklusPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.__terraSiklusPool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");
    const instance = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    instance.on("error", (error) => {
      console.error("TerraSiklus PostgreSQL pool:", error);
    });
    globalForDb.__terraSiklusPool = instance;
  }
  return globalForDb.__terraSiklusPool;
}

/**
 * Klien PostgreSQL yang baru terhubung ketika query pertama dijalankan.
 *
 * Modul ini tetap bisa diimpor tanpa `DATABASE_URL`, sehingga `next build`
 * tidak gagal saat environment build belum terhubung ke database. Koneksi
 * baru dibuat pada permintaan pertama dan dipakai ulang berikutnya.
 *
 * Nama kelas memuat "Pool" karena Drizzle memakai pola tersebut untuk
 * mendeteksi apakah transaksi harus berjalan pada koneksi khusus.
 */
class LazyPool {
  query(queryTextOrConfig: unknown, values?: unknown[]): Promise<QueryResult> {
    return (getPool().query as (...args: unknown[]) => Promise<QueryResult>)(
      queryTextOrConfig,
      values,
    );
  }
  connect(): Promise<PoolClient> {
    return getPool().connect();
  }
  on(event: string, listener: (...args: unknown[]) => void): this {
    (getPool().on as (...args: unknown[]) => unknown)(event, listener);
    return this;
  }
  end(): Promise<void> {
    return getPool().end();
  }
}

export const pool = new LazyPool();

export const db = drizzle(pool as unknown as Pool);
