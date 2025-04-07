export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  customerName: string;
  customerLocation: string;
  date: string;
  status: 'Ingepland' | 'In uitvoering' | 'Voltooid' | 'Geannuleerd';
  materials: WorkOrderMaterial[];
  laborHours: number;
  notes: string;
}

export interface WorkOrderMaterial {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  type: 'Particulier' | 'Zakelijk';
  address: {
    street: string;
    postalCode: string;
    city: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  status: 'Actief' | 'Inactief';
  workOrders: string[]; // IDs of work orders
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
  lastOrderDate: string | null;
}

export interface Invoice {
  id: string;
  customer: {
    id: string;
    name: string;
  };
  workOrder: {
    id: string;
    title: string;
  };
  date: string;
  dueDate: string;
  amount: number;
  status: 'Concept' | 'Verzonden' | 'Betaald' | 'Te laat';
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  customer: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  progress: number;
  status: 'Gepland' | 'In uitvoering' | 'Voltooid' | 'Gepauzeerd';
  workOrders: string[]; // IDs of related work orders
}
