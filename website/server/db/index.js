import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'gokarna_connect.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log(`Connected to shared SQLite database at ${dbPath}`);
    // Enable WAL mode & foreign keys for concurrent reads/writes
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Run schema initialization
export function initDatabase() {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error applying schema:', err.message);
        reject(err);
      } else {
        db.run(`ALTER TABLE homestay_images ADD COLUMN category TEXT DEFAULT 'general'`, (alterErr) => {
          if (alterErr && !String(alterErr.message).includes('duplicate column')) {
            console.error('Migration warning:', alterErr.message);
          }
          db.run(`ALTER TABLE bookings ADD COLUMN channel TEXT DEFAULT 'Direct website'`, (chanErr) => {
            if (chanErr && !String(chanErr.message).includes('duplicate column')) {
              console.error('Migration warning:', chanErr.message);
            }
            db.run(`ALTER TABLE room_status ADD COLUMN reason TEXT`, (rsErr) => {
              if (rsErr && !String(rsErr.message).includes('duplicate column')) {
                console.error('Migration warning:', rsErr.message);
              }
              db.run(`ALTER TABLE homestays ADD COLUMN status TEXT DEFAULT 'live'`, (stErr) => {
                if (stErr && !String(stErr.message).includes('duplicate column')) {
                  console.error('Migration warning:', stErr.message);
                }
                db.run(`ALTER TABLE homestays ADD COLUMN instant_booking INTEGER DEFAULT 1`, (ibErr) => {
                  if (ibErr && !String(ibErr.message).includes('duplicate column')) {
                    console.error('Migration warning:', ibErr.message);
                  }
                  console.log('Database schema successfully verified/initialized.');
                  resolve();
                });
              });
            });
          });
        });
      }
    });
  });
}

// Async query wrappers
export function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export default db;
