import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("finance"), // 'admin' or 'finance'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  slno: varchar("slno"),
  name: varchar("name").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).default("0.00"),
  role: varchar("role"),
  team: varchar("team"),
  cId: varchar("c_id"),
  startDate: varchar("start_date"),
  endDate: varchar("end_date"),
  status: varchar("status").notNull().default("inactive"), // 'active' or 'inactive'
  band: varchar("band"),
  sowId: varchar("sow_id"),
  appxBilling: decimal("appx_billing", { precision: 10, scale: 2 }).default("0.00"),
  shift: varchar("shift"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing rates table
export const billingRates = pgTable("billing_rates", {
  id: serial("id").primaryKey(),
  band: varchar("band").notNull(),
  offshoreRate: decimal("offshore_rate", { precision: 10, scale: 2 }).notNull(),
  onsiteRate: decimal("onsite_rate", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects/SOW table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  sowId: varchar("sow_id").notNull().unique(),
  name: varchar("name"),
  startDate: varchar("start_date"),
  endDate: varchar("end_date"),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertBillingRateSchema = createInsertSchema(billingRates).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type BillingRate = typeof billingRates.$inferSelect;
export type InsertBillingRate = z.infer<typeof insertBillingRateSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
