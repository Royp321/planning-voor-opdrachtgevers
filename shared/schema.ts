import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").default("monteur").notNull(), // monteur or beheerder
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerNumber: text("customer_number").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Particulier or Zakelijk
  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  email: text("email"),
  phone: text("phone"),
  status: text("status").default("Actief").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  articleNumber: text("article_number").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").default(0),
  minStock: integer("min_stock").default(0),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  customerId: integer("customer_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").default("Ingepland").notNull(),
  laborHours: real("labor_hours").default(0),
  notes: text("notes"),
  materials: jsonb("materials"), // Array of used materials
  photos: jsonb("photos"), // Array of photo data (base64 strings)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  workOrderId: integer("work_order_id"),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: real("amount").notNull(),
  status: text("status").default("Concept").notNull(),
  items: jsonb("items"), // Invoice line items
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  customerId: integer("customer_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0),
  status: text("status").default("Gepland").notNull(),
  workOrders: jsonb("work_orders"), // Array of related work order IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Export the insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });

// Export the types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Project = typeof projects.$inferSelect;
