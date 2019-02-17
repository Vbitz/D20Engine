import * as sqlite from 'sqlite';

export interface TableSpecification {
  name: string;
  nameColumn: string;
}

export class Database {
  private db: sqlite.Database|null = null;

  async loadSqlite(filename: string) {
    this.db = await sqlite.open(filename);
  }

  async getRows<T>(tableSpec: TableSpecification): Promise<T[]> {
    if (this.db === null) {
      throw new Error('Database not loaded.');
    }

    const rows = await this.db.all<T>(`SELECT * from ${tableSpec.name}`);

    return rows;
  }

  async get<T>(tableSpec: TableSpecification, name: string):
      Promise<T|undefined> {
    if (this.db === null) {
      throw new Error('Database not loaded.');
    }

    const row = await this.db.get<T>(
        `SELECT * from ${tableSpec.name} WHERE ${
            tableSpec.nameColumn} = ? COLLATE NOCASE`,
        name);

    return row;
  }

  async search<T>(tableSpec: TableSpecification, search: string, limit = 10):
      Promise<T[]> {
    if (this.db === null) {
      throw new Error('Database not loaded.');
    }

    const rows = await this.db.all<T>(
        `SELECT * from ${tableSpec.name} WHERE ${
            tableSpec.nameColumn} LIKE ? LIMIT ? COLLATE NOCASE`,
        `%${search}%`, limit);

    return rows;
  }
}