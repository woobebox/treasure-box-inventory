import type { Table } from 'dexie';
import { db } from './database';

export async function writeLocalChange<T>(tables: Table[], operation: () => Promise<T>): Promise<T> {
  return db.transaction('rw', tables, operation);
}
