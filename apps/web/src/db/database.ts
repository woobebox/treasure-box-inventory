import Dexie, { type EntityTable, type Table } from 'dexie';
import type { AppSetting, ConflictRecord, DeviceSync, HistoryEntry, Household, HouseholdMember, Item, ItemTag, Location, Photo, SyncOp, Tag } from '../domain/types';
import { schemaV1 } from './schema';

export class InventoryDatabase extends Dexie {
  households!: EntityTable<Household, 'id'>;
  householdMembers!: EntityTable<HouseholdMember, 'id'>;
  items!: EntityTable<Item, 'id'>;
  photos!: EntityTable<Photo, 'id'>;
  locations!: EntityTable<Location, 'id'>;
  tags!: EntityTable<Tag, 'id'>;
  itemTags!: Table<ItemTag, [string, string]>;
  history!: EntityTable<HistoryEntry, 'id'>;
  syncOps!: EntityTable<SyncOp, 'id'>;
  deviceSync!: Table<DeviceSync, [string, string]>;
  conflicts!: EntityTable<ConflictRecord, 'id'>;
  settings!: Table<AppSetting, [string, string]>;

  constructor() {
    super('treasure-box-inventory');
    this.version(1).stores(schemaV1);
  }
}

export const db = new InventoryDatabase();
