import lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import { Schema } from './types';

const getDb = async () => {
  const adapter = new FileAsync<Schema>('db.json');
  const db = await lowdb(adapter);
  db.defaults({ infos: [] }).write();
  return db;
};

export default getDb;
