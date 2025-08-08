import {
  users,
  employees,
  billingRates,
  projects,
  costCentres,
  bands,
  shifts,
  roles,
  teams,
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
  type CostCentre,
  type InsertCostCentre,
  type UpdateCostCentre,
  type Band,
  type InsertBand,
  type UpdateBand,
  type Shift,
  type InsertShift,
  type UpdateShift,
  type Role,
  type InsertRole,
  type UpdateRole,
  type Team,
  type InsertTeam,
  type UpdateTeam,
  type ChangePassword,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, and, or, desc, asc, sql, ne, isNotNull, isNull, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations for simple authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  loginUser(credentials: LoginRequest): Promise<User | null>;
  // User management operations
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  changeUserPassword(userId: number, passwordData: ChangePassword): Promise<void>;
  initializeUsers(): Promise<void>;

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
  getRecentChanges(): Promise<Employee[]>;
  getChangeReports(filters?: {
    period?: 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
    search?: string;
    team?: string;
    status?: string;
  }, pagination?: {
    page: number;
    limit: number;
  }, sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ reports: Employee[]; total: number; page: number; totalPages: number; }>;

  // Billing operations
  getBillingRates(): Promise<BillingRate[]>;
  createBillingRate(rate: InsertBillingRate): Promise<BillingRate>;
  updateBillingRate(id: number, rate: Partial<InsertBillingRate>): Promise<BillingRate>;

  // Project operations
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  // CSV import
  importEmployeesFromCSV(data: any[]): Promise<{ imported: number; errors: string[] }>;
  
  // Reports
  getCostCentreBillingReport(filters?: {
    search?: string;
  }, pagination?: {
    page: number;
    limit: number;
  }, sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ 
    billing: { costCentre: string; totalBilling: number; employeeCount: number; averageRate: number }[];
    total: number;
    page: number;
    totalPages: number;
    totalBilling: number;
    totalEmployees: number;
  }>;
  getCostCentrePerformanceData(): Promise<{ costCentre: string; monthlyData: { month: string; billing: number; employees: number; averageRate: number }[] }[]>;

  // Configuration operations
  getCostCentres(): Promise<CostCentre[]>;
  createCostCentre(costCentre: InsertCostCentre): Promise<CostCentre>;
  updateCostCentre(id: number, costCentre: UpdateCostCentre): Promise<CostCentre>;
  deleteCostCentre(id: number): Promise<void>;

  getBands(): Promise<Band[]>;
  createBand(band: InsertBand): Promise<Band>;
  updateBand(id: number, band: UpdateBand): Promise<Band>;
  deleteBand(id: number): Promise<void>;

  getShifts(): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: UpdateShift): Promise<Shift>;
  deleteShift(id: number): Promise<void>;

  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: UpdateRole): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: UpdateTeam): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Initialize configuration data
  initializeConfigurationData(): Promise<void>;
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

  // User management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async changeUserPassword(userId: number, passwordData: ChangePassword): Promise<void> {
    console.log("=== CHANGE PASSWORD STORAGE METHOD ===");
    console.log("Received userId:", userId, "Type:", typeof userId);
    console.log("Password data:", { 
      currentPassword: passwordData.currentPassword, 
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword 
    });
    
    // First verify the current password
    const user = await this.getUser(userId);
    console.log("Found user:", user ? `${user.username} (ID: ${user.id})` : 'null');
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Simple password comparison (in production, this should use proper hashing)
    if (user.password !== passwordData.currentPassword) {
      throw new Error("Current password is incorrect");
    }
    
    console.log("Password verification successful, updating...");
    
    // Update with new password
    await db
      .update(users)
      .set({ password: passwordData.newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
      
    console.log("Password update completed successfully");
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
        ilike(employees.name, `${search}%`)
      );
    }

    if (team && team !== 'all') {
      conditions.push(eq(employees.team, team));
    }

    if (status && status !== 'all') {
      conditions.push(eq(employees.status, status));
    } else {
      // By default, exclude deleted employees from regular listings
      conditions.push(ne(employees.status, 'deleted'));
    }

    if (role && role !== 'all') {
      conditions.push(eq(employees.role, role));
    }

    if (costCentre && costCentre !== 'all') {
      if (costCentre === 'none') {
        conditions.push(or(
          eq(employees.costCentre, ''),
          isNull(employees.costCentre)
        ));
      } else {
        conditions.push(eq(employees.costCentre, costCentre));
      }
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
      costCentre: employees.costCentre,
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
      .values({
        ...employee,
        changesSummary: 'New employee added',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee> {
    // Get the current employee data to compare changes
    const [currentEmployee] = await db.select().from(employees).where(eq(employees.id, id));
    
    if (!currentEmployee) {
      throw new Error("Employee not found");
    }

    // Generate changes summary
    const changes: string[] = [];
    const fieldsToCheck = {
      name: 'Name',
      role: 'Role', 
      team: 'Team',
      status: 'Status',
      rate: 'Rate',
      costCentre: 'Cost Centre',
      cId: 'C-ID',
      band: 'Band',
      shift: 'Shift',
      startDate: 'Start Date',
      endDate: 'End Date',
      appxBilling: 'Billing Amount'
    };

    for (const [field, label] of Object.entries(fieldsToCheck)) {
      const oldValue = currentEmployee[field as keyof Employee];
      const newValue = employee[field as keyof UpdateEmployee];
      
      if (newValue !== undefined && oldValue !== newValue) {
        changes.push(`${label}: ${oldValue || 'None'} → ${newValue || 'None'}`);
      }
    }

    const changesSummary = changes.length > 0 ? changes.join('; ') : 'Minor update';

    const [updatedEmployee] = await db
      .update(employees)
      .set({ 
        ...employee, 
        changesSummary,
        updatedAt: new Date() 
      })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    // Get employee info before marking as deleted
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    
    if (employee) {
      // Mark employee as deleted instead of removing from database
      await db
        .update(employees)
        .set({
          status: 'deleted',
          changesSummary: `Employee deleted: ${employee.name} (${employee.role || 'Unknown role'})`,
          updatedAt: new Date()
        })
        .where(eq(employees.id, id));
    } else {
      // If employee not found, still delete to maintain API consistency
      await db.delete(employees).where(eq(employees.id, id));
    }
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
        isNotNull(employees.team),
        ne(employees.status, 'deleted')
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
        isNotNull(employees.costCentre),
        ne(employees.status, 'deleted')
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
      .from(employees)
      .where(ne(employees.status, 'deleted'));

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

  async getRecentChanges(): Promise<Employee[]> {
    const result = await db
      .select()
      .from(employees)
      .orderBy(desc(employees.updatedAt))
      .limit(10);
    
    // Debug logging removed for cleaner production logs
    
    return result;
  }

  async getChangeReports(filters: {
    period?: 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
    search?: string;
    team?: string;
    status?: string;
  } = {}, pagination?: {
    page: number;
    limit: number;
  }, sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ reports: Employee[]; total: number; page: number; totalPages: number; }> {
    const { period, startDate, endDate, search, team, status } = filters;
    const paginationConfig = pagination || { page: 1, limit: 25 };
    const sortConfig = sorting || { sortBy: 'updatedAt', sortOrder: 'desc' };
    
    let dateCondition;
    const now = new Date();
    
    if (startDate && endDate) {
      dateCondition = and(
        sql`${employees.updatedAt} >= ${startDate}`,
        sql`${employees.updatedAt} <= ${endDate}`
      );
    } else if (period) {
      let periodStart: Date;
      switch (period) {
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      dateCondition = sql`${employees.updatedAt} >= ${periodStart.toISOString()}`;
    }

    const conditions = [
      isNotNull(employees.changesSummary),
      ne(employees.changesSummary, ''),
      dateCondition
    ].filter(Boolean);

    // Add search filter
    if (search) {
      conditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.costCentre, `%${search}%`),
          ilike(employees.team, `%${search}%`)
        )
      );
    }

    // Add team filter
    if (team) {
      conditions.push(eq(employees.team, team));
    }

    // Add status filter
    if (status) {
      conditions.push(eq(employees.status, status));
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);

    // Calculate pagination
    const total = Number(totalCount);
    const totalPages = Math.ceil(total / paginationConfig.limit);
    const offset = (paginationConfig.page - 1) * paginationConfig.limit;

    // Determine sort order
    const sortColumn = sortConfig.sortBy === 'name' ? employees.name : employees.updatedAt;
    const sortOrder = sortConfig.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const reports = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(paginationConfig.limit)
      .offset(offset);

    return {
      reports,
      total,
      page: paginationConfig.page,
      totalPages,
    };
  }

  async getCostCentreBillingReport(filters?: {
    search?: string;
  }, pagination?: {
    page: number;
    limit: number;
  }, sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ 
    billing: { costCentre: string; totalBilling: number; employeeCount: number; averageRate: number }[];
    total: number;
    page: number;
    totalPages: number;
    totalBilling: number;
    totalEmployees: number;
  }> {
    const searchFilter = filters?.search;
    const paginationConfig = pagination || { page: 1, limit: 25 };
    const sortConfig = sorting || { sortBy: 'totalBilling', sortOrder: 'desc' };

    const baseConditions = [
      isNotNull(employees.costCentre),
      ne(employees.costCentre, ''),
      ne(employees.status, 'deleted')
    ];

    // Add search filter
    if (searchFilter) {
      baseConditions.push(ilike(employees.costCentre, `%${searchFilter}%`));
    }

    const whereClause = and(...baseConditions);

    // Get aggregated data first
    const result = await db
      .select({
        costCentre: employees.costCentre,
        totalBilling: sql<number>`sum(case when status = 'active' then appx_billing else 0 end)`,
        employeeCount: sql<number>`count(case when status = 'active' then 1 else null end)`,
        averageRate: sql<number>`avg(case when status = 'active' and rate > 0 then rate else null end)`
      })
      .from(employees)
      .where(whereClause)
      .groupBy(employees.costCentre);

    const billingData = result.map(row => ({
      costCentre: row.costCentre || 'Unknown',
      totalBilling: Number(row.totalBilling) || 0,
      employeeCount: Number(row.employeeCount) || 0,
      averageRate: Number(row.averageRate) || 0
    }));

    // Calculate overall totals
    const totalBilling = billingData.reduce((sum, item) => sum + item.totalBilling, 0);
    const totalEmployees = billingData.reduce((sum, item) => sum + item.employeeCount, 0);

    // Apply sorting
    billingData.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.sortBy) {
        case 'costCentre':
          aValue = a.costCentre;
          bValue = b.costCentre;
          break;
        case 'employeeCount':
          aValue = a.employeeCount;
          bValue = b.employeeCount;
          break;
        case 'averageRate':
          aValue = a.averageRate;
          bValue = b.averageRate;
          break;
        case 'totalBilling':
        default:
          aValue = a.totalBilling;
          bValue = b.totalBilling;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // Handle numeric comparison
      const numA = Number(aValue);
      const numB = Number(bValue);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      // Fallback to string comparison
      return sortConfig.sortOrder === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    });

    // Apply pagination
    const total = billingData.length;
    const totalPages = Math.ceil(total / paginationConfig.limit);
    const offset = (paginationConfig.page - 1) * paginationConfig.limit;
    const paginatedBilling = billingData.slice(offset, offset + paginationConfig.limit);

    return {
      billing: paginatedBilling,
      total,
      page: paginationConfig.page,
      totalPages,
      totalBilling,
      totalEmployees,
    };
  }

  async getCostCentrePerformanceData(): Promise<{ 
    costCentre: string; 
    monthlyData: { month: string; billing: number; employees: number; averageRate: number }[] 
  }[]> {
    // Generate the last 6 months of data for sparkline charts
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        monthStart: date.toISOString(),
        monthEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
      });
    }

    const costCentres = await db
      .selectDistinct({ costCentre: employees.costCentre })
      .from(employees)
      .where(and(
        isNotNull(employees.costCentre),
        ne(employees.costCentre, ''),
        ne(employees.status, 'deleted')
      ));

    const performanceData = [];

    for (const centre of costCentres) {
      const monthlyData = [];
      
      for (const monthInfo of months) {
        // Simulate historical performance with some variation based on current data
        const baseResult = await db
          .select({
            totalBilling: sql<number>`sum(case when status = 'active' then appx_billing else 0 end)`,
            employeeCount: sql<number>`count(case when status = 'active' then 1 else null end)`,
            averageRate: sql<number>`avg(case when status = 'active' and rate > 0 then rate else null end)`
          })
          .from(employees)
          .where(and(
            eq(employees.costCentre, centre.costCentre!),
            ne(employees.status, 'deleted')
          ));

        const base = baseResult[0];
        const monthIndex = months.indexOf(monthInfo);
        
        // Create realistic variation patterns for demo
        const billingVariation = 0.85 + (Math.sin(monthIndex * 0.5) * 0.15) + (Math.random() * 0.1);
        const employeeVariation = 0.9 + (Math.random() * 0.2);
        const rateVariation = 0.95 + (Math.random() * 0.1);

        monthlyData.push({
          month: monthInfo.month,
          billing: Math.round((Number(base.totalBilling) || 0) * billingVariation),
          employees: Math.round((Number(base.employeeCount) || 0) * employeeVariation),
          averageRate: Number(((Number(base.averageRate) || 0) * rateVariation).toFixed(2))
        });
      }

      performanceData.push({
        costCentre: centre.costCentre!,
        monthlyData
      });
    }

    return performanceData;
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

  // Configuration operations
  async getCostCentres(): Promise<CostCentre[]> {
    return await db.select().from(costCentres).orderBy(costCentres.code);
  }

  async createCostCentre(costCentreData: InsertCostCentre): Promise<CostCentre> {
    const [costCentre] = await db
      .insert(costCentres)
      .values({ ...costCentreData, updatedAt: new Date() })
      .returning();
    return costCentre;
  }

  async updateCostCentre(id: number, costCentreData: UpdateCostCentre): Promise<CostCentre> {
    const [costCentre] = await db
      .update(costCentres)
      .set({ ...costCentreData, updatedAt: new Date() })
      .where(eq(costCentres.id, id))
      .returning();
    return costCentre;
  }

  async deleteCostCentre(id: number): Promise<void> {
    await db.delete(costCentres).where(eq(costCentres.id, id));
  }

  async getBands(): Promise<Band[]> {
    return await db.select().from(bands).where(eq(bands.isActive, true)).orderBy(bands.level);
  }

  async createBand(bandData: InsertBand): Promise<Band> {
    const [band] = await db
      .insert(bands)
      .values({ ...bandData, updatedAt: new Date() })
      .returning();
    return band;
  }

  async updateBand(id: number, bandData: UpdateBand): Promise<Band> {
    const [band] = await db
      .update(bands)
      .set({ ...bandData, updatedAt: new Date() })
      .where(eq(bands.id, id))
      .returning();
    return band;
  }

  async deleteBand(id: number): Promise<void> {
    await db
      .update(bands)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(bands.id, id));
  }

  async getShifts(): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.isActive, true)).orderBy(shifts.name);
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const [shift] = await db
      .insert(shifts)
      .values({ ...shiftData, updatedAt: new Date() })
      .returning();
    return shift;
  }

  async updateShift(id: number, shiftData: UpdateShift): Promise<Shift> {
    const [shift] = await db
      .update(shifts)
      .set({ ...shiftData, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    return shift;
  }

  async deleteShift(id: number): Promise<void> {
    await db
      .update(shifts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shifts.id, id));
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.isActive, true)).orderBy(roles.title);
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values({ ...roleData, updatedAt: new Date() })
      .returning();
    return role;
  }

  async updateRole(id: number, roleData: UpdateRole): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    await db
      .update(roles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(roles.id, id));
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.isActive, true)).orderBy(teams.name);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values({ ...teamData, updatedAt: new Date() })
      .returning();
    return team;
  }

  async updateTeam(id: number, teamData: UpdateTeam): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ ...teamData, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<void> {
    await db
      .update(teams)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teams.id, id));
  }

  async initializeConfigurationData(): Promise<void> {
    // Initialize default cost centres
    const existingCostCentres = await db.select().from(costCentres);
    if (existingCostCentres.length === 0) {
      await db.insert(costCentres).values([
        { code: "MH-BYN", description: "Mumbai Borivali office operations" },
        { code: "MH-OPS", description: "Mumbai operations center" },
        { code: "EXR-OPS", description: "External operations and support" },
      ]);
    }

    // Initialize default bands
    const existingBands = await db.select().from(bands);
    if (existingBands.length === 0) {
      await db.insert(bands).values([
        { level: "B1", name: "Junior", minRate: "25.00", maxRate: "35.00" },
        { level: "B2", name: "Senior", minRate: "35.00", maxRate: "45.00" },
        { level: "B3", name: "Lead", minRate: "45.00", maxRate: "60.00" },
        { level: "B4", name: "Principal", minRate: "60.00", maxRate: "80.00" },
      ]);
    }

    // Initialize default shifts
    const existingShifts = await db.select().from(shifts);
    if (existingShifts.length === 0) {
      await db.insert(shifts).values([
        { name: "Day Shift", startTime: "09:00", endTime: "18:00", timezone: "IST" },
        { name: "Night Shift", startTime: "22:00", endTime: "07:00", timezone: "IST" },
        { name: "US Shift", startTime: "19:00", endTime: "04:00", timezone: "EST" },
        { name: "UK Shift", startTime: "13:30", endTime: "22:30", timezone: "GMT" },
      ]);
    }

    // Initialize default roles
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        { title: "Software Engineer", department: "Engineering", level: "Individual Contributor" },
        { title: "Senior Software Engineer", department: "Engineering", level: "Individual Contributor" },
        { title: "Team Lead", department: "Engineering", level: "Management" },
        { title: "Technical Architect", department: "Engineering", level: "Individual Contributor" },
        { title: "DevOps Engineer", department: "Engineering", level: "Individual Contributor" },
        { title: "QA Engineer", department: "Quality Assurance", level: "Individual Contributor" },
        { title: "Business Analyst", department: "Operations", level: "Individual Contributor" },
        { title: "Project Manager", department: "Operations", level: "Management" },
      ]);
    }

    // Initialize default teams
    const existingTeams = await db.select().from(teams);
    if (existingTeams.length === 0) {
      await db.insert(teams).values([
        { name: "Frontend Development", department: "Engineering", manager: "Tech Lead" },
        { name: "Backend Development", department: "Engineering", manager: "Tech Lead" },
        { name: "DevOps & Infrastructure", department: "Engineering", manager: "Senior Engineer" },
        { name: "Quality Assurance", department: "Quality Assurance", manager: "QA Lead" },
        { name: "Business Analysis", department: "Operations", manager: "Senior BA" },
        { name: "Project Management", department: "Operations", manager: "PM Lead" },
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
