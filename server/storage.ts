import {
  users,
  employees,
  billingRates,
  projects,
  type User,
  type InsertUser,
  type LoginRequest,
  type Employee,
  type InsertEmployee,
  type UpdateEmployee,
  type BillingRate,
  type InsertBillingRate,
  type Project,
  type InsertProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, asc, sql, ne, isNotNull, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations for simple authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  loginUser(credentials: LoginRequest): Promise<User | null>;

  // Employee operations
  getEmployees(filters?: {
    search?: string;
    team?: string;
    status?: string;
    role?: string;
    costCentre?: string;
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
  getDistinctTeams(): Promise<string[]>;
  getDistinctCostCentres(): Promise<string[]>;

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
  // User operations for simple authentication
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async loginUser(credentials: LoginRequest): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, credentials.username),
        eq(users.password, credentials.password) // In production, compare hashed passwords
      ));
    return user || null;
  }

  // Initialize predefined users
  async initializeUsers(): Promise<void> {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await this.createUser({
        username: "admin",
        password: "admin123",
        email: "admin@company.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      });
      await this.createUser({
        username: "finance",
        password: "finance123", 
        email: "finance@company.com",
        firstName: "Finance",
        lastName: "Manager",
        role: "finance"
      });
    }
  }

  // Employee operations
  async getEmployees(filters: {
    search?: string;
    team?: string;
    status?: string;
    role?: string;
    costCentre?: string;
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
      costCentre,
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

    if (costCentre && costCentre !== 'all') {
      conditions.push(eq(employees.costCentre, costCentre));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Get employees with pagination and sorting
    const sortColumns: Record<string, any> = {
      name: employees.name,
      role: employees.role,
      team: employees.team,
      cId: employees.cId,
      status: employees.status,
      rate: employees.rate,
      startDate: employees.startDate,
      appxBilling: employees.appxBilling,
    };
    
    const orderColumn = sortColumns[sortBy] || employees.name;
    const orderBy = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    
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

  async clearAllEmployees(): Promise<void> {
    await db.delete(employees);
  }

  async getDistinctTeams(): Promise<string[]> {
    const result = await db
      .selectDistinct({ team: employees.team })
      .from(employees)
      .where(and(
        ne(employees.team, ""),
        isNotNull(employees.team)
      ))
      .orderBy(employees.team);
    
    return result.map(row => row.team).filter(Boolean) as string[];
  }

  async getDistinctCostCentres(): Promise<string[]> {
    const result = await db
      .selectDistinct({ costCentre: employees.costCentre })
      .from(employees)
      .where(and(
        ne(employees.costCentre, ""),
        isNotNull(employees.costCentre)
      ))
      .orderBy(employees.costCentre);
    
    return result.map(row => row.costCentre).filter(Boolean) as string[];
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

    return teams.filter(t => t.team && t.team !== 'NA').map(t => ({
      team: t.team!,
      count: Number(t.count)
    }));
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
          rate: row.Rate ? row.Rate.toString().replace('$', '').replace(',', '') : "0.00",
          role: row.Role,
          team: row.Team || 'NA',
          costCentre: row['Cost-Centre'],
          cId: row['C-ID'],
          startDate: row['Start-Date'],
          endDate: row['End-Date'],
          status: row.Status?.toLowerCase() === 'active' ? 'active' : 'inactive',
          band: row.Band,
          sowId: row['SOW-ID'],
          appxBilling: row['Appx Billing'] ? row['Appx Billing'].toString().replace('$', '').replace(',', '') : "0.00",
          shift: row.Shift,
          comments: row.Comments,
        };

        if (employee.name) {
          await this.createEmployee(employee);
          imported++;
        }
      } catch (error) {
        errors.push(`Error importing row ${row.SLNO}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { imported, errors };
  }
}

export const storage = new DatabaseStorage();
