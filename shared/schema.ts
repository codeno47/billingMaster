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

// User storage table for simple authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // In production, this should be hashed
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
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
  costCentre: varchar("cost_centre"), // Cost Centre (MH-BYN, MH-OPS, EXR-OPS)
  cId: varchar("c_id"), // C-ID (C74337, C51149, etc.)
  startDate: varchar("start_date"),
  endDate: varchar("end_date"),
  status: varchar("status").notNull().default("inactive"), // 'active' or 'inactive'
  band: varchar("band"),
  sowId: varchar("sow_id"),
  appxBilling: decimal("appx_billing", { precision: 10, scale: 2 }).default("0.00"),
  shift: varchar("shift"),
  comments: text("comments"),
  changesSummary: text("changes_summary"), // Summary of what changed in the last update
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

// Configuration tables for settings module
export const costCentres = pgTable("cost_centres", {
  id: serial("id").primaryKey(),
  code: varchar("code").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bands = pgTable("bands", {
  id: serial("id").primaryKey(),
  level: varchar("level").notNull().unique(),
  name: varchar("name").notNull(),
  minRate: decimal("min_rate", { precision: 10, scale: 2 }),
  maxRate: decimal("max_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  startTime: varchar("start_time"),
  endTime: varchar("end_time"),
  timezone: varchar("timezone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull().unique(),
  department: varchar("department"),
  level: varchar("level"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  department: varchar("department"),
  manager: varchar("manager"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

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

// Configuration insert schemas
export const insertCostCentreSchema = createInsertSchema(costCentres).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBandSchema = createInsertSchema(bands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schemas
export const updateCostCentreSchema = insertCostCentreSchema.partial();
export const updateBandSchema = insertBandSchema.partial();
export const updateShiftSchema = insertShiftSchema.partial();
export const updateRoleSchema = insertRoleSchema.partial();
export const updateTeamSchema = insertTeamSchema.partial();

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type BillingRate = typeof billingRates.$inferSelect;
export type InsertBillingRate = z.infer<typeof insertBillingRateSchema>;

// Configuration types
export type CostCentre = typeof costCentres.$inferSelect;
export type InsertCostCentre = z.infer<typeof insertCostCentreSchema>;
export type UpdateCostCentre = z.infer<typeof updateCostCentreSchema>;

export type Band = typeof bands.$inferSelect;
export type InsertBand = z.infer<typeof insertBandSchema>;
export type UpdateBand = z.infer<typeof updateBandSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type UpdateShift = z.infer<typeof updateShiftSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
