import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { insertEmployeeSchema, updateEmployeeSchema, insertBillingRateSchema, insertProjectSchema, loginSchema } from "@shared/schema";
import { parseCSV } from "./services/csv-parser";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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
      const { employees } = await storage.getEmployees({ limit: 10000 });
      
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

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
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
      const { period, startDate, endDate } = req.query;
      const filters = {
        period: period as 'week' | 'month' | 'year',
        startDate: startDate as string,
        endDate: endDate as string,
      };
      
      const changeReports = await storage.getChangeReports(filters);
      res.json(changeReports);
    } catch (error) {
      console.error("Error fetching change reports:", error);
      res.status(500).json({ message: "Failed to fetch change reports" });
    }
  });

  app.get("/api/reports/cost-centre-billing", isAuthenticated, async (req, res) => {
    try {
      const costCentreBilling = await storage.getCostCentreBillingReport();
      res.json(costCentreBilling);
    } catch (error) {
      console.error("Error fetching cost centre billing report:", error);
      res.status(500).json({ message: "Failed to fetch cost centre billing report" });
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

  // CSV import (admin only)
  app.post("/api/employees/import", isAuthenticated, requireRole('admin'), upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvData = await parseCSV(req.file.buffer);
      const result = await storage.importEmployeesFromCSV(csvData);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV", error: error.message });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
