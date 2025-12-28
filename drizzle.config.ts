import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./learnmap.db",
  },
});

// import { defineConfig } from "drizzle-kit";

// export default defineConfig({
//   out: "./drizzle",
//   schema: "./shared/schema.ts",
//   dialect: "sqlite",
//   dbCredentials: {
//     url: "./learnmap.db",
//   },
// });

// import { defineConfig } from "drizzle-kit";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL, ensure the database is provisioned");
// }

// export default defineConfig({
//   out: "./migrations",
//   schema: "./shared/schema.ts",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
// });
