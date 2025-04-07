import { 
  users, customers, materials, workOrders, invoices, projects,
  type User, type InsertUser, type Customer, type InsertCustomer, 
  type Material, type InsertMaterial, type WorkOrder, type InsertWorkOrder, 
  type Invoice, type InsertInvoice, type Project, type InsertProject 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import { hashPassword } from "./auth";

const MemoryStore = createMemoryStore(session);
const PgSessionStore = connectPg(session);

// Interface for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customer methods
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Material methods
  getAllMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Work Order methods
  getAllWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;
  
  // Invoice methods
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Project methods
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private materials: Map<number, Material>;
  private workOrders: Map<number, WorkOrder>;
  private invoices: Map<number, Invoice>;
  private projects: Map<number, Project>;
  
  sessionStore: session.Store;
  
  // ID counters
  private userIdCounter: number;
  private customerIdCounter: number;
  private materialIdCounter: number;
  private workOrderIdCounter: number;
  private invoiceIdCounter: number;
  private projectIdCounter: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.materials = new Map();
    this.workOrders = new Map();
    this.invoices = new Map();
    this.projects = new Map();
    
    this.userIdCounter = 1;
    this.customerIdCounter = 1;
    this.materialIdCounter = 1;
    this.workOrderIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.projectIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create admin user
    const adminId = this.userIdCounter++;
    const adminUser: User = {
      id: adminId,
      username: "admin",
      email: "admin@spartec.nl",
      fullName: "Admin User",
      phone: "06-12345678",
      // hardcoded password is admin123
      password: "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec.e5e9fa1ba31ecd1ae84f75caaa474f3a",
      role: "beheerder",
      createdAt: new Date()
    };
    this.users.set(adminId, adminUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "monteur", 
      createdAt: now,
      email: insertUser.email || null,
      phone: insertUser.phone || null 
    };
    this.users.set(id, user);
    return user;
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const now = new Date();
    const customerNumber = `KL-${String(id).padStart(5, '0')}`;
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      customerNumber, 
      createdAt: now,
      // Ensure required fields have default values if not provided
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      status: insertCustomer.status || "Actief"
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = { ...existingCustomer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Material methods
  async getAllMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.materialIdCounter++;
    const now = new Date();
    const articleNumber = `ART-${String(id).padStart(5, '0')}`;
    const material: Material = { 
      ...insertMaterial, 
      id, 
      articleNumber, 
      createdAt: now,
      // Ensure required fields have default values
      brand: insertMaterial.brand || null,
      stock: insertMaterial.stock || null,
      minStock: insertMaterial.minStock || null,
      supplier: insertMaterial.supplier || null
    };
    this.materials.set(id, material);
    return material;
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const existingMaterial = this.materials.get(id);
    if (!existingMaterial) return undefined;
    
    const updatedMaterial = { ...existingMaterial, ...materialData };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Work Order methods
  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.workOrderIdCounter++;
    const now = new Date();
    const orderNumber = `WB-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
    const workOrder: WorkOrder = { 
      ...insertWorkOrder, 
      id, 
      orderNumber, 
      createdAt: now,
      // Ensure required fields have default values
      status: insertWorkOrder.status || "Ingepland",
      description: insertWorkOrder.description || null,
      laborHours: insertWorkOrder.laborHours || null,
      notes: insertWorkOrder.notes || null,
      materials: insertWorkOrder.materials || []
    };
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: number, workOrderData: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const existingWorkOrder = this.workOrders.get(id);
    if (!existingWorkOrder) return undefined;
    
    const updatedWorkOrder = { ...existingWorkOrder, ...workOrderData };
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    return this.workOrders.delete(id);
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const now = new Date();
    const invoiceNumber = `F-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
    const invoice: Invoice = { 
      ...insertInvoice, 
      id, 
      invoiceNumber, 
      createdAt: now,
      // Ensure required fields have default values
      status: insertInvoice.status || "Concept",
      workOrderId: insertInvoice.workOrderId || null,
      items: insertInvoice.items || []
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice = { ...existingInvoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Project methods
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now,
      // Ensure required fields have default values
      status: insertProject.status || "Gepland",
      description: insertProject.description || null,
      endDate: insertProject.endDate || null,
      progress: insertProject.progress || 0,
      workOrders: insertProject.workOrders || []
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    try {
      // Try to set up PostgreSQL session store
      this.sessionStore = new PgSessionStore({
        pool,
        createTableIfMissing: true,
        tableName: 'session',
        pruneSessionInterval: 60 // cleanup sessions every minute
      });
      console.log("PostgreSQL session store initialized");
    } catch (error) {
      // Fallback to memory store if PostgreSQL store fails
      console.error("Failed to initialize PostgreSQL session store, using memory store as fallback:", error);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // 24 hours
      });
    }
    
    // Initialize database with admin user
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByUsername('admin');
      if (!adminUser) {
        // Create initial admin user
        await this.createUser({
          username: "admin",
          fullName: "Admin User",
          email: "admin@spar-tec.nl",
          phone: "06-12345678",
          password: await hashPassword("admin123"),
          role: "beheerder",
        });
        console.log("Admin user created successfully");
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user by username: "${username}"`);
      
      // Use case-insensitive search for better matching
      const sqlQuery = `
        SELECT * FROM users 
        WHERE LOWER(username) = LOWER($1)
      `;
      
      // Use direct pool query for more flexibility
      const result = await pool.query(sqlQuery, [username]);
      
      if (result.rows.length === 0) {
        console.log(`No user found with username: "${username}"`);
        return undefined;
      }
      
      const user = result.rows[0];
      console.log(`Found user: ${user.username} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers).orderBy(desc(customers.id));
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const result = await db.select().from(customers).where(eq(customers.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      return undefined;
    }
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    try {
      // Generate customer number
      const customerNumber = await this.generateCustomerNumber();
      const [customer] = await db.insert(customers)
        .values({ ...insertCustomer, customerNumber })
        .returning();
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  private async generateCustomerNumber(): Promise<string> {
    try {
      const result = await db.select({ customerNumber: customers.customerNumber })
        .from(customers)
        .orderBy(desc(customers.id))
        .limit(1);
      
      const year = new Date().getFullYear();
      const prefix = `KL-${year}-`;
      
      if (result.length === 0) {
        return `${prefix}0001`;
      }
      
      const latestNumber = result[0].customerNumber;
      if (latestNumber && latestNumber.startsWith(prefix)) {
        const number = parseInt(latestNumber.substring(prefix.length));
        if (!isNaN(number)) {
          return `${prefix}${(number + 1).toString().padStart(4, '0')}`;
        }
      }
      
      return `${prefix}0001`;
    } catch (error) {
      console.error('Error generating customer number:', error);
      return `KL-${new Date().getFullYear()}-0001`;
    }
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      const [customer] = await db.update(customers)
        .set(customerData)
        .where(eq(customers.id, id))
        .returning();
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      return undefined;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customers).where(eq(customers.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Material methods
  async getAllMaterials(): Promise<Material[]> {
    try {
      return await db.select().from(materials).orderBy(desc(materials.id));
    } catch (error) {
      console.error('Error getting all materials:', error);
      return [];
    }
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    try {
      const result = await db.select().from(materials).where(eq(materials.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting material by ID:', error);
      return undefined;
    }
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    try {
      // Generate article number
      const articleNumber = await this.generateArticleNumber();
      const [material] = await db.insert(materials)
        .values({ ...insertMaterial, articleNumber })
        .returning();
      return material;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  private async generateArticleNumber(): Promise<string> {
    try {
      const result = await db.select({ articleNumber: materials.articleNumber })
        .from(materials)
        .orderBy(desc(materials.id))
        .limit(1);
      
      const prefix = 'ART-';
      
      if (result.length === 0) {
        return `${prefix}000001`;
      }
      
      const latestNumber = result[0].articleNumber;
      if (latestNumber && latestNumber.startsWith(prefix)) {
        const number = parseInt(latestNumber.substring(prefix.length));
        if (!isNaN(number)) {
          return `${prefix}${(number + 1).toString().padStart(6, '0')}`;
        }
      }
      
      return `${prefix}000001`;
    } catch (error) {
      console.error('Error generating article number:', error);
      return `ART-000001`;
    }
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    try {
      const [material] = await db.update(materials)
        .set(materialData)
        .where(eq(materials.id, id))
        .returning();
      return material;
    } catch (error) {
      console.error('Error updating material:', error);
      return undefined;
    }
  }

  async deleteMaterial(id: number): Promise<boolean> {
    try {
      const result = await db.delete(materials).where(eq(materials.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  }

  // Work Order methods
  async getAllWorkOrders(): Promise<WorkOrder[]> {
    try {
      return await db.select().from(workOrders).orderBy(desc(workOrders.id));
    } catch (error) {
      console.error('Error getting all work orders:', error);
      return [];
    }
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    try {
      const result = await db.select().from(workOrders).where(eq(workOrders.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting work order by ID:', error);
      return undefined;
    }
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();
      
      // Prepare data for SQL query
      const data = { ...insertWorkOrder, orderNumber };
      
      // Use direct SQL query to avoid date conversion issues
      const query = `
        INSERT INTO work_orders (
          order_number, title, description, customer_id, 
          date, status, labor_hours, notes, materials
        ) VALUES (
          $1, $2, $3, $4, 
          NOW(), $5, $6, $7, $8
        ) RETURNING *
      `;
      
      // Convert materials to JSON string
      const materialsJson = JSON.stringify(data.materials || []);
      
      console.log('Creating work order with direct SQL method from storage');
      
      // Execute query with parameters
      const result = await pool.query(query, [
        orderNumber,
        data.title,
        data.description,
        data.customerId,
        data.status || 'Ingepland',
        data.laborHours || 0,
        data.notes || '',
        materialsJson
      ]);
      
      if (result.rows.length > 0) {
        const workOrder = result.rows[0];
        console.log('Successfully created work order:', workOrder);
        return workOrder;
      } else {
        throw new Error('Failed to create work order');
      }
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  private async generateOrderNumber(): Promise<string> {
    try {
      const result = await db.select({ orderNumber: workOrders.orderNumber })
        .from(workOrders)
        .orderBy(desc(workOrders.id))
        .limit(1);
      
      const year = new Date().getFullYear();
      const prefix = `WB-${year}-`;
      
      if (result.length === 0) {
        return `${prefix}0001`;
      }
      
      const latestNumber = result[0].orderNumber;
      if (latestNumber && latestNumber.startsWith(prefix)) {
        const number = parseInt(latestNumber.substring(prefix.length));
        if (!isNaN(number)) {
          return `${prefix}${(number + 1).toString().padStart(4, '0')}`;
        }
      }
      
      return `${prefix}0001`;
    } catch (error) {
      console.error('Error generating order number:', error);
      return `WB-${new Date().getFullYear()}-0001`;
    }
  }

  async updateWorkOrder(id: number, workOrderData: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    try {
      // Direct SQL approach for update to avoid date conversion issues
      const data = { ...workOrderData };
      
      // First get existing record to merge with updates
      const existingWorkOrder = await this.getWorkOrder(id);
      if (!existingWorkOrder) {
        return undefined;
      }
      
      // Build SQL update parts based on provided fields
      const updateParts = [];
      const values = [id]; // First param is always the ID
      let paramIndex = 2; // Start from 2 since $1 is the ID
      
      // Build dynamic SET clause based on provided fields
      if (data.title !== undefined) {
        updateParts.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      
      if (data.description !== undefined) {
        updateParts.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.customerId !== undefined) {
        updateParts.push(`customer_id = $${paramIndex++}`);
        values.push(data.customerId);
      }
      
      if (data.status !== undefined) {
        updateParts.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      
      if (data.laborHours !== undefined) {
        updateParts.push(`labor_hours = $${paramIndex++}`);
        values.push(data.laborHours);
      }
      
      if (data.notes !== undefined) {
        updateParts.push(`notes = $${paramIndex++}`);
        values.push(data.notes);
      }
      
      if (data.materials !== undefined) {
        updateParts.push(`materials = $${paramIndex++}`);
        values.push(JSON.stringify(data.materials));
      }
      
      // Handle date conversion if needed
      if (data.date !== undefined) {
        updateParts.push(`date = $${paramIndex++}`);
        if (typeof data.date === 'string') {
          values.push(new Date(data.date));
        } else {
          values.push(data.date);
        }
      }
      
      // Return early if no fields to update
      if (updateParts.length === 0) {
        return existingWorkOrder;
      }
      
      // Build and execute SQL query
      const query = `
        UPDATE work_orders
        SET ${updateParts.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      console.log('SQL update query:', query);
      console.log('SQL update values:', values);
      
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return undefined;
      }
    } catch (error) {
      console.error('Error updating work order:', error);
      return undefined;
    }
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    try {
      const result = await db.delete(workOrders).where(eq(workOrders.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting work order:', error);
      return false;
    }
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices).orderBy(desc(invoices.id));
    } catch (error) {
      console.error('Error getting all invoices:', error);
      return [];
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      return undefined;
    }
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      const [invoice] = await db.insert(invoices)
        .values({ ...insertInvoice, invoiceNumber })
        .returning();
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    try {
      const result = await db.select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .orderBy(desc(invoices.id))
        .limit(1);
      
      const year = new Date().getFullYear();
      const prefix = `F-${year}-`;
      
      if (result.length === 0) {
        return `${prefix}0001`;
      }
      
      const latestNumber = result[0].invoiceNumber;
      if (latestNumber && latestNumber.startsWith(prefix)) {
        const number = parseInt(latestNumber.substring(prefix.length));
        if (!isNaN(number)) {
          return `${prefix}${(number + 1).toString().padStart(4, '0')}`;
        }
      }
      
      return `${prefix}0001`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `F-${new Date().getFullYear()}-0001`;
    }
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.update(invoices)
        .set(invoiceData)
        .where(eq(invoices.id, id))
        .returning();
      return invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  // Project methods
  async getAllProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects).orderBy(desc(projects.id));
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await db.select().from(projects).where(eq(projects.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting project by ID:', error);
      return undefined;
    }
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    try {
      const [project] = await db.insert(projects)
        .values(insertProject)
        .returning();
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const [project] = await db.update(projects)
        .set(projectData)
        .where(eq(projects.id, id))
        .returning();
      return project;
    } catch (error) {
      console.error('Error updating project:', error);
      return undefined;
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await db.delete(projects).where(eq(projects.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
