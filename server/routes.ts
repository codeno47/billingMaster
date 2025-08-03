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
      
      res.json({
        ...stats,
        teamDistribution,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
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

  // Export employees
  app.get("/api/employees/export", isAuthenticated, async (req, res) => {
    try {
      const { employees } = await storage.getEmployees({ limit: 10000 });
      
      // Convert to CSV format
      const headers = [
        'Name', 'Role', 'Team', 'Rate', 'Status', 'Band', 'SOW ID', 
        'Appx Billing', 'Shift', 'Start Date', 'End Date', 'Comments'
      ];
      
      const csvContent = [
        headers.join(','),
        ...employees.map(emp => [
          emp.name,
          emp.role,
          emp.team,
          emp.rate,
          emp.status,
          emp.band,
          emp.sowId,
          emp.appxBilling,
          emp.shift,
          emp.startDate,
          emp.endDate,
          emp.comments
        ].map(field => `"${field || ''}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting employees:", error);
      res.status(500).json({ message: "Failed to export employees" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
