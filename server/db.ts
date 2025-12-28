import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// Create SQLite database file
const sqlite = new Database("./learnmap.db");

// Create tables first
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS roadmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    daily_focus_time INTEGER DEFAULT 60,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roadmap_id INTEGER NOT NULL,
    parent_id INTEGER,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'other',
    topic TEXT,
    resource_url TEXT,
    time_estimate INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_started',
    content TEXT,
    "order" INTEGER DEFAULT 0,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Now create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database with default user
function initDatabase() {
  try {
    // Insert default user if not exists
    const checkStmt = sqlite.prepare("SELECT id FROM users WHERE id = ?");
    const existingUser = checkStmt.get('local-dev-user');
    
    if (!existingUser) {
      const insertStmt = sqlite.prepare(`
        INSERT INTO users (id, email, first_name, last_name)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run('local-dev-user', 'dev@local.com', 'Local', 'Developer');
      console.log("✅ Default user created: dev@local.com");
    } else {
      console.log("✅ Using existing user: dev@local.com");
    }
    
    console.log("✅ SQLite database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

// Run initialization
initDatabase();

// import { drizzle } from "drizzle-orm/better-sqlite3";
// import Database from "better-sqlite3";
// import * as schema from "@shared/schema";

// // Create SQLite database file
// const sqlite = new Database("./learnmap.db");
// export const db = drizzle(sqlite, { schema });

// // Initialize database with default user
// async function initDatabase() {
//   try {
//     // Create tables if they don't exist (Drizzle will handle this, but we also want default user)
//     const stmt = sqlite.prepare(`
//       INSERT OR IGNORE INTO users (id, email, first_name, last_name)
//       VALUES ('local-dev-user', 'dev@local.com', 'Local', 'Developer')
//     `);
//     stmt.run();
    
//     console.log("✅ SQLite database initialized with default user: dev@local.com");
//   } catch (error) {
//     console.error("❌ Database initialization error:", error);
//   }
// }

// // Run initialization
// initDatabase();

// // import { drizzle } from "drizzle-orm/node-postgres";
// // import pg from "pg";
// // import * as schema from "@shared/schema";

// // const { Pool } = pg;

// // if (!process.env.DATABASE_URL) {
// //   throw new Error(
// //     "DATABASE_URL must be set. Did you forget to provision a database?",
// //   );
// // }

// // export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// // export const db = drizzle(pool, { schema });
