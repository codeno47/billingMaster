import {
  users,
  employees,
  billingRates,
  projects,
  type User,
  type UpsertUser,
  type Employee,
  type InsertEmployee,
  type UpdateEmployee,
  type BillingRate,
  type InsertBillingRate,
  type Project,
  type InsertProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Employee operations
  getEmployees(filters?: {
    search?: string;
    team?: string;
    status?: string;
    role?: string;
    offset?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ employees: Employee[]; total: number }>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    monthlyBilling: number;
    averageRate: number;
  }>;
  getTeamDistribution(): Promise<{ team: string; count: number }[]>;

  // Billing operations
  getBillingRates(): Promise<BillingRate[]>;
  createBillingRate(rate: InsertBillingRate): Promise<BillingRate>;
  updateBillingRate(id: number, rate: Partial<InsertBillingRate>): Promise<BillingRate>;

  // Project operations
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  // CSV import
  importEmployeesFromCSV(data: any[]): Promise<{ imported: number; errors: string[] }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Employee operations
  async getEmployees(filters: {
    search?: string;
    team?: string;
    status?: string;
    role?: string;
    offset?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ employees: Employee[]; total: number }> {
    const {
      search,
      team,
      status,
      role,
      offset = 0,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(employees.name, `%${search}%`),
          like(employees.cId, `%${search}%`),
          like(employees.team, `%${search}%`)
        )
      );
    }

    if (team && team !== 'all') {
      conditions.push(eq(employees.team, team));
    }

    if (status && status !== 'all') {
      conditions.push(eq(employees.status, status));
    }

    if (role && role !== 'all') {
      conditions.push(eq(employees.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Get employees with pagination and sorting
    const orderBy = sortOrder === 'desc' ? desc(employees[sortBy as keyof typeof employees]) : asc(employees[sortBy as keyof typeof employees]);
    
    const employeesList = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit);

    return { employees: employeesList, total };
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    monthlyBilling: number;
    averageRate: number;
  }> {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when status = 'active' then 1 else 0 end)`,
        inactive: sql<number>`sum(case when status = 'inactive' then 1 else 0 end)`,
        monthlyBilling: sql<number>`sum(case when status = 'active' then appx_billing else 0 end)`,
        averageRate: sql<number>`avg(case when status = 'active' and rate > 0 then rate else null end)`,
      })
      .from(employees);

    return stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      monthlyBilling: 0,
      averageRate: 0,
    };
  }

  async getTeamDistribution(): Promise<{ team: string; count: number }[]> {
    const teams = await db
      .select({
        team: employees.team,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(and(eq(employees.status, 'active'), ne(employees.team, 'NA')))
      .groupBy(employees.team)
      .orderBy(desc(sql`count(*)`));

    return teams.filter(t => t.team && t.team !== 'NA');
  }

  // Billing operations
  async getBillingRates(): Promise<BillingRate[]> {
    return await db.select().from(billingRates).orderBy(billingRates.band);
  }

  async createBillingRate(rate: InsertBillingRate): Promise<BillingRate> {
    const [newRate] = await db
      .insert(billingRates)
      .values(rate)
      .returning();
    return newRate;
  }

  async updateBillingRate(id: number, rate: Partial<InsertBillingRate>): Promise<BillingRate> {
    const [updatedRate] = await db
      .update(billingRates)
      .set(rate)
      .where(eq(billingRates.id, id))
      .returning();
    return updatedRate;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  // CSV import
  async importEmployeesFromCSV(data: any[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const row of data) {
      try {
        const employee: InsertEmployee = {
          slno: row.SLNO?.toString(),
          name: row.Name,
          rate: row.Rate ? parseFloat(row.Rate.replace('$', '').replace(',', '')) : 0,
          role: row.Role,
          team: row.Team || 'NA',
          cId: row['C-ID'],
          startDate: row['Start-Date'],
          endDate: row['End-Date'],
          status: row.Status?.toLowerCase() === 'active' ? 'active' : 'inactive',
          band: row.Band,
          sowId: row['SOW-ID'],
          appxBilling: row['Appx Billing'] ? parseFloat(row['Appx Billing'].replace('$', '').replace(',', '')) : 0,
          shift: row.Shift,
          comments: row.Comments,
        };

        if (employee.name) {
          await this.createEmployee(employee);
          imported++;
        }
      } catch (error) {
        errors.push(`Error importing row ${row.SLNO}: ${error.message}`);
      }
    }

    return { imported, errors };
  }
}

export const storage = new DatabaseStorage();
