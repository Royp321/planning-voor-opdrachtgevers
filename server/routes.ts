import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Fetch all the necessary data for the dashboard
      const [workOrders, customers, materials, invoices] = await Promise.all([
        storage.getAllWorkOrders(),
        storage.getAllCustomers(),
        storage.getAllMaterials(),
        storage.getAllInvoices(),
      ]);
      
      // Calculate month-by-month revenue for the current year
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = Array(12).fill(0).map((_, month) => {
        const amount = invoices
          .filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getMonth() === month && 
                   invDate.getFullYear() === currentYear && 
                   inv.status !== 'Concept';
          })
          .reduce((sum, inv) => sum + (inv.amount || 0), 0);
          
        return { 
          month: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][month], 
          amount 
        };
      });
      
      // Calculate work order status counts
      const workOrdersByStatus = {
        nieuw: workOrders.filter(wo => wo.status === 'Nieuw').length,
        inBehandeling: workOrders.filter(wo => wo.status === 'In behandeling').length,
        voltooid: workOrders.filter(wo => wo.status === 'Voltooid').length
      };
      
      // Calculate invoice status counts
      const invoicesByStatus = {
        concept: invoices.filter(inv => inv.status === 'Concept').length,
        verzonden: invoices.filter(inv => inv.status === 'Verzonden').length,
        betaald: invoices.filter(inv => inv.status === 'Betaald').length,
        teLaat: invoices.filter(inv => inv.status === 'Te laat').length
      };
      
      // Get materials with low stock
      const lowStockMaterials = materials
        .filter(m => m.stock !== null && m.minStock !== null && m.stock <= m.minStock)
        .slice(0, 5);
      
      // Get recent invoices (sorted by date)
      const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      // Prepare and send the response
      res.json({
        totalWorkOrders: workOrders.length,
        totalCustomers: customers.length,
        totalMaterials: materials.length,
        totalInvoices: invoices.length,
        workOrdersByStatus,
        invoicesByStatus,
        recentInvoices,
        lowStockMaterials,
        monthlyRevenue
      });
    } catch (error) {
      console.error("Error generating dashboard stats:", error);
      res.status(500).json({ message: "Failed to generate dashboard statistics" });
    }
  });

  // Customers API endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const newCustomer = await storage.createCustomer(req.body);
      res.status(201).json(newCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error creating customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const updatedCustomer = await storage.updateCustomer(parseInt(req.params.id), req.body);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error updating customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting customer" });
    }
  });

  // Work Orders API endpoints
  app.get("/api/workorders", async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching work orders" });
    }
  });

  app.get("/api/workorders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(parseInt(req.params.id));
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: "Error fetching work order" });
    }
  });

  app.post("/api/workorders", async (req, res) => {
    try {
      console.log('Creating work order, data:', req.body);
      const workOrder = await storage.createWorkOrder(req.body);
      console.log('Work order created:', workOrder);
      res.status(201).json(workOrder);
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ message: "Error creating work order" });
    }
  });

  app.put("/api/workorders/:id", async (req, res) => {
    try {
      console.log('Updating work order with id:', req.params.id, 'data:', req.body);
      const workOrderId = parseInt(req.params.id);
      
      const updatedWorkOrder = await storage.updateWorkOrder(workOrderId, req.body);
      
      if (!updatedWorkOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      console.log('Updated work order:', updatedWorkOrder);
      res.json(updatedWorkOrder);
    } catch (error) {
      console.error('Error updating work order:', error);
      res.status(500).json({ message: "Error updating work order" });
    }
  });

  app.delete("/api/workorders/:id", async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      
      const success = await storage.deleteWorkOrder(workOrderId);
      
      if (!success) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting work order:', error);
      res.status(500).json({ message: "Error deleting work order" });
    }
  });

  // Special endpoints voor werkbon status updates
  app.patch("/api/workorders/:id/status", async (req, res) => {
    try {
      console.log('Updating work order status with id:', req.params.id, 'data:', req.body);
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const workOrderId = parseInt(req.params.id);
      const updatedWorkOrder = await storage.updateWorkOrder(workOrderId, { status });
      
      if (!updatedWorkOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      console.log('Updated work order after status update:', updatedWorkOrder);
      res.json(updatedWorkOrder);
    } catch (error) {
      console.error('Error updating work order status:', error);
      res.status(500).json({ message: "Error updating work order status" });
    }
  });
  
  // Complete work order with photos
  app.put("/api/workorders/:id/complete", async (req, res) => {
    try {
      console.log('Completing work order with id:', req.params.id, 'data:', req.body);
      
      const { notes, laborHours, photos } = req.body;
      
      // Validate input
      if (laborHours === undefined) {
        return res.status(400).json({ message: "Labor hours are required" });
      }
      
      const workOrderId = parseInt(req.params.id);
      const updatedWorkOrder = await storage.updateWorkOrder(workOrderId, { 
        status: "Voltooid",
        notes,
        laborHours,
        photos
      });
      
      if (!updatedWorkOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      console.log('Work order completed successfully:', updatedWorkOrder);
      res.json(updatedWorkOrder);
    } catch (error) {
      console.error('Error completing work order:', error);
      res.status(500).json({ message: "Error completing work order" });
    }
  });

  // Materials API endpoints
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getAllMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Error fetching materials" });
    }
  });

  app.get("/api/materials/:id", async (req, res) => {
    try {
      const material = await storage.getMaterial(parseInt(req.params.id));
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const newMaterial = await storage.createMaterial(req.body);
      res.status(201).json(newMaterial);
    } catch (error) {
      res.status(500).json({ message: "Error creating material" });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const updatedMaterial = await storage.updateMaterial(parseInt(req.params.id), req.body);
      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(updatedMaterial);
    } catch (error) {
      res.status(500).json({ message: "Error updating material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const success = await storage.deleteMaterial(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting material" });
    }
  });

  // Invoices API endpoints
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const newInvoice = await storage.createInvoice(req.body);
      res.status(201).json(newInvoice);
    } catch (error) {
      res.status(500).json({ message: "Error creating invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const updatedInvoice = await storage.updateInvoice(parseInt(req.params.id), req.body);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({ message: "Error updating invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const success = await storage.deleteInvoice(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting invoice" });
    }
  });

  // Projects API endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const newProject = await storage.createProject(req.body);
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ message: "Error creating project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const updatedProject = await storage.updateProject(parseInt(req.params.id), req.body);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Error updating project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting project" });
    }
  });

  // Set up HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
