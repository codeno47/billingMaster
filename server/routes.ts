import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { insertEmployeeSchema, updateEmployeeSchema, insertBillingRateSchema, insertProjectSchema, loginSchema, insertUserSchema, updateUserSchema, changePasswordSchema } from "@shared/schema";
import { parseCSV } from "./services/csv-parser";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const user = await storage.loginUser(result.data);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const user = await storage.loginUser(result.data);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const {
        search,
        team,
        status,
        role,
        costCentre,
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const result = await storage.getEmployees({
        search,
        team,
        status,
        role,
        costCentre,
        offset,
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      });

      res.json({
        employees: result.employees,
        total: result.total,
        page: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get distinct teams (must come before /:id route)
  app.get("/api/employees/teams", isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getDistinctTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get distinct cost centres (must come before /:id route)
  app.get("/api/employees/cost-centres", isAuthenticated, async (req, res) => {
    try {
      const costCentres = await storage.getDistinctCostCentres();
      res.json(costCentres);
    } catch (error) {
      console.error("Error fetching cost centres:", error);
      res.status(500).json({ message: "Failed to fetch cost centres" });
    }
  });

  // Export employees (must come before /:id route)
  app.get("/api/employees/export", isAuthenticated, async (req, res) => {
    try {
      // Use the same filtering logic as the main employee list
      const {
        search,
        team,
        status,
        role,
        costCentre,
        sortBy = 'name',
        sortOrder = 'asc'
      } = {
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        team: typeof req.query.team === 'string' ? req.query.team : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
        costCentre: typeof req.query.costCentre === 'string' ? req.query.costCentre : undefined,
        sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name',
        sortOrder: (req.query.sortOrder === 'desc' || req.query.sortOrder === 'asc') ? req.query.sortOrder : 'asc'
      };

      // Get filtered employees using the same parameters as the main listing
      const { employees } = await storage.getEmployees({
        search,
        team,
        status,
        role,
        costCentre,
        offset: 0,
        limit: 10000, // Export all matching records
        sortBy,
        sortOrder
      });
      
      // Convert to CSV format matching the provided template
      const headers = [
        'SLNO', 'Name', 'Rate', 'Role', 'Cost-Centre', 'Team', 'C-ID', 
        'Start-Date', 'End-Date', 'Status', 'Band', 'SOW-ID', 'Appx Billing', 'Shift', 'Comments'
      ];
      
      const csvContent = [
        headers.join(','),
        ...employees.map((emp, index) => {
          // Format rate with $ prefix
          const formattedRate = emp.rate && !isNaN(Number(emp.rate)) ? `$${Number(emp.rate).toFixed(2)}` : '$0.00';
          
          // Format appx billing with $ prefix and comma separator
          const formattedBilling = emp.appxBilling && !isNaN(Number(emp.appxBilling)) 
            ? `"$${Number(emp.appxBilling).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"` 
            : '"$0.00"';
          
          // Capitalize status
          const formattedStatus = emp.status === 'active' ? 'Active' : 'Inactive';
          
          return [
            emp.slno || (index + 1).toString(),
            emp.name || '',
            formattedRate,
            emp.role || '',
            emp.costCentre || '',
            emp.team || '',
            emp.cId || '',
            emp.startDate || '',
            emp.endDate || '',
            formattedStatus,
            emp.band || '',
            emp.sowId || '',
            formattedBilling,
            emp.shift || '',
            emp.comments || ''
          ].map((field, idx) => idx === 12 ? field : `"${field}"`).join(','); // Don't double-quote the billing field
        })
      ].join('\n');

      // Generate filename with filter indication
      const hasFilters = search || (team && team !== 'all') || (status && status !== 'all') || 
                        (role && role !== 'all') || (costCentre && costCentre !== 'all');
      const filename = hasFilters ? 'employees_filtered_export.csv' : 'employees_export.csv';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting employees:", error);
      res.status(500).json({ message: "Failed to export employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee", error: error.message });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(parseInt(req.params.id), validatedData);
      res.json(employee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee", error: error.message });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteEmployee(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.delete("/api/employees", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.clearAllEmployees();
      res.json({ message: "All employees cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing employees:", error);
      res.status(500).json({ message: "Failed to clear employees" });
    }
  });



  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getEmployeeStats();
      const teamDistribution = await storage.getTeamDistribution();
      const recentChanges = await storage.getRecentChanges();
      
      res.json({
        ...stats,
        teamDistribution,
        recentChanges,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Change reports
  app.get("/api/reports/changes", isAuthenticated, async (req, res) => {
    try {
      const { period, startDate, endDate, search, team, status, page, limit, sortBy, sortOrder } = req.query;
      const filters = {
        period: period as 'week' | 'month' | 'year',
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        team: team === 'all' ? undefined : team as string,
        status: status === 'all' ? undefined : status as string,
      };
      
      const pagination = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 25,
      };
      
      const sorting = {
        sortBy: (sortBy as string) || 'updatedAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };
      
      const changeReports = await storage.getChangeReports(filters, pagination, sorting);
      res.json(changeReports);
    } catch (error) {
      console.error("Error fetching change reports:", error);
      res.status(500).json({ message: "Failed to fetch change reports" });
    }
  });

  app.get("/api/reports/cost-centre-billing", isAuthenticated, async (req, res) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;
      const filters = {
        search: search as string,
      };
      
      const pagination = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 25,
      };
      
      const sorting = {
        sortBy: (sortBy as string) || 'totalBilling',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };
      
      const costCentreBilling = await storage.getCostCentreBillingReport(filters, pagination, sorting);
      res.json(costCentreBilling);
    } catch (error) {
      console.error("Error fetching cost centre billing report:", error);
      res.status(500).json({ message: "Failed to fetch cost centre billing report" });
    }
  });

  app.get("/api/reports/cost-centre-performance", isAuthenticated, async (req, res) => {
    try {
      const performanceData = await storage.getCostCentrePerformanceData();
      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching cost centre performance data:", error);
      res.status(500).json({ message: "Failed to fetch cost centre performance data" });
    }
  });

  // Billing routes
  app.get("/api/billing/rates", isAuthenticated, async (req, res) => {
    try {
      const rates = await storage.getBillingRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching billing rates:", error);
      res.status(500).json({ message: "Failed to fetch billing rates" });
    }
  });

  // Configuration routes (admin only)
  // Cost Centre routes
  app.get("/api/config/cost-centres", isAuthenticated, async (req, res) => {
    try {
      const costCentres = await storage.getCostCentres();
      res.json(costCentres);
    } catch (error) {
      console.error("Error fetching cost centres:", error);
      res.status(500).json({ message: "Failed to fetch cost centres" });
    }
  });

  app.post("/api/config/cost-centres", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const costCentre = await storage.createCostCentre(req.body);
      res.json(costCentre);
    } catch (error) {
      console.error("Error creating cost centre:", error);
      res.status(500).json({ message: "Failed to create cost centre" });
    }
  });

  app.put("/api/config/cost-centres/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const costCentre = await storage.updateCostCentre(parseInt(req.params.id), req.body);
      res.json(costCentre);
    } catch (error) {
      console.error("Error updating cost centre:", error);
      res.status(500).json({ message: "Failed to update cost centre" });
    }
  });

  app.delete("/api/config/cost-centres/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteCostCentre(parseInt(req.params.id));
      res.json({ message: "Cost centre deleted successfully" });
    } catch (error) {
      console.error("Error deleting cost centre:", error);
      res.status(500).json({ message: "Failed to delete cost centre" });
    }
  });

  // Band routes
  app.get("/api/config/bands", isAuthenticated, async (req, res) => {
    try {
      const bands = await storage.getBands();
      res.json(bands);
    } catch (error) {
      console.error("Error fetching bands:", error);
      res.status(500).json({ message: "Failed to fetch bands" });
    }
  });

  app.post("/api/config/bands", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const band = await storage.createBand(req.body);
      res.json(band);
    } catch (error) {
      console.error("Error creating band:", error);
      res.status(500).json({ message: "Failed to create band" });
    }
  });

  app.put("/api/config/bands/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const band = await storage.updateBand(parseInt(req.params.id), req.body);
      res.json(band);
    } catch (error) {
      console.error("Error updating band:", error);
      res.status(500).json({ message: "Failed to update band" });
    }
  });

  app.delete("/api/config/bands/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteBand(parseInt(req.params.id));
      res.json({ message: "Band deleted successfully" });
    } catch (error) {
      console.error("Error deleting band:", error);
      res.status(500).json({ message: "Failed to delete band" });
    }
  });

  // Shift routes
  app.get("/api/config/shifts", isAuthenticated, async (req, res) => {
    try {
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post("/api/config/shifts", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const shift = await storage.createShift(req.body);
      res.json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.put("/api/config/shifts/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const shift = await storage.updateShift(parseInt(req.params.id), req.body);
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/config/shifts/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteShift(parseInt(req.params.id));
      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Role routes
  app.get("/api/config/roles", isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/config/roles", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/config/roles/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const role = await storage.updateRole(parseInt(req.params.id), req.body);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/config/roles/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteRole(parseInt(req.params.id));
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Team routes
  app.get("/api/config/teams", isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/config/teams", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put("/api/config/teams/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const team = await storage.updateTeam(parseInt(req.params.id), req.body);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/config/teams/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteTeam(parseInt(req.params.id));
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // User Management routes (admin only)
  app.get("/api/users", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response for security
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user", error: error.message });
    }
  });

  app.put("/api/users/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(parseInt(req.params.id), validatedData);
      // Remove password from response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user", error: error.message });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Password change endpoint (any authenticated user can change their own password)
  app.put("/api/users/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const userId = req.session.userId;
      
      await storage.changeUserPassword(userId, validatedData);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.message === "Current password is incorrect") {
        res.status(400).json({ message: "Current password is incorrect" });
      } else {
        res.status(400).json({ message: "Failed to change password", error: error.message });
      }
    }
  });

  // CSV import (admin only)
  app.post("/api/employees/import", isAuthenticated, requireRole('admin'), upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if file is empty
      if (req.file.size === 0) {
        return res.status(400).json({ message: "Cannot import empty file. Please upload a CSV file with employee data." });
      }

      const csvData = await parseCSV(req.file.buffer);
      
      console.log(`CSV parsing result: ${csvData ? csvData.length : 0} records found`);
      
      // Check if CSV has no data records (only headers or completely empty)
      if (!csvData || csvData.length === 0) {
        return res.status(400).json({ message: "CSV file contains no employee data. Please ensure the file has valid employee records." });
      }

      const result = await storage.importEmployeesFromCSV(csvData);
      
      // Additional check: if no employees were successfully imported
      if (result.imported === 0 && result.errors.length === 0) {
        return res.status(400).json({ message: "No valid employee records found in the CSV file. Please check the file format and data." });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV", error: error.message });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
