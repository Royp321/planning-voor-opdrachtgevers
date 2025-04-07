import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/tables/DataTable";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FaEye, FaPrint, FaEnvelope, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Invoice } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Schema voor het aanmaken/bewerken van facturen
const invoiceSchema = z.object({
  customerId: z.number().int().min(1, "Klant is verplicht"),
  workOrderId: z.number().int().optional().nullable(),
  date: z.date(),
  dueDate: z.date(),
  amount: z.number().min(0, "Bedrag moet 0 of hoger zijn"),
  status: z.string().min(1, "Status is verplicht"),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).optional().nullable(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoicesPage() {
  const { setActiveView } = useNavigation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Fetch invoices
  const { 
    data: invoices = [], 
    isLoading,
    error 
  } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van facturen');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
    }
  });
  
  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
    retry: 1,
  });
  
  // Fetch work orders for the dropdown
  const { data: workOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/workorders'],
    retry: 1,
  });
  
  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const response = await apiRequest('POST', '/api/invoices', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Factuur aangemaakt",
        description: "De factuur is succesvol aangemaakt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het aanmaken van de factuur: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InvoiceFormValues> }) => {
      const response = await apiRequest('PUT', `/api/invoices/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Factuur bijgewerkt",
        description: "De factuur is succesvol bijgewerkt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het bijwerken van de factuur: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/invoices/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Factuur verwijderd",
        description: "De factuur is succesvol verwijderd.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het verwijderen van de factuur: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form handlers
  const createForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: 0,
      workOrderId: null,
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      amount: 0,
      status: "Concept",
      items: [],
    },
  });
  
  const editForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: selectedInvoice?.customerId || 0,
      workOrderId: selectedInvoice?.workOrderId || null,
      date: selectedInvoice?.date ? new Date(selectedInvoice.date) : new Date(),
      dueDate: selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate) : new Date(new Date().setDate(new Date().getDate() + 30)),
      amount: selectedInvoice?.amount || 0,
      status: selectedInvoice?.status || "Concept",
      items: selectedInvoice?.items || [],
    },
  });
  
  // Sync form values when selectedInvoice changes
  useEffect(() => {
    if (selectedInvoice) {
      editForm.reset({
        customerId: selectedInvoice.customerId,
        workOrderId: selectedInvoice.workOrderId || null,
        date: new Date(selectedInvoice.date),
        dueDate: new Date(selectedInvoice.dueDate),
        amount: selectedInvoice.amount,
        status: selectedInvoice.status,
        items: selectedInvoice.items || [],
      });
    }
  }, [selectedInvoice, editForm]);
  
  useEffect(() => {
    setActiveView("facturen");
  }, [setActiveView]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCreateSubmit = (data: InvoiceFormValues) => {
    createInvoiceMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: InvoiceFormValues) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, data });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (selectedInvoice) {
      deleteInvoiceMutation.mutate(selectedInvoice.id);
    }
  };
  
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };
  
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };
  
  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };
  
  // Table columns configuration
  const columns = [
    {
      header: "Factuurnr.",
      accessorKey: "invoiceNumber",
      cell: (row: Invoice) => (
        <span className="text-sm font-medium text-primary">{row.invoiceNumber}</span>
      ),
    },
    {
      header: "Klant",
      accessorKey: "customerId",
      cell: (row: Invoice) => {
        const customer = customers?.find(c => c.id === row.customerId);
        return (
          <span className="text-sm text-gray-500">{customer?.name || "Onbekend"}</span>
        );
      },
    },
    {
      header: "Datum",
      accessorKey: "date",
      cell: (row: Invoice) => (
        <span className="text-sm text-gray-500">{format(new Date(row.date), 'dd-MM-yyyy')}</span>
      ),
    },
    {
      header: "Bedrag",
      accessorKey: "amount",
      cell: (row: Invoice) => (
        <span className="text-sm text-gray-500">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Invoice) => {
        let statusClass = "";
        switch (row.status) {
          case "Betaald":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "Verzonden":
            statusClass = "bg-blue-100 text-blue-800";
            break;
          case "Te laat":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Concept":
            statusClass = "bg-gray-100 text-gray-800";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Acties",
      accessorKey: (row: Invoice) => (
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
            onClick={() => handleView(row)}
          >
            <FaEye />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
            onClick={() => handleEdit(row)}
          >
            <FaEdit />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
          >
            <FaPrint />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
          >
            <FaEnvelope />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDelete(row)}
          >
            <FaTrash />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];
  
  // Filter logic
  const filteredData = invoices ? invoices.filter((invoice: Invoice) => {
    // Status filter
    if (statusFilter !== "all") {
      const statusMap: Record<string, string> = {
        "draft": "Concept",
        "sent": "Verzonden",
        "paid": "Betaald",
        "overdue": "Te laat"
      };
      if (invoice.status !== statusMap[statusFilter]) {
        return false;
      }
    }
    
    // Period filter - simplified for now
    if (periodFilter !== "all") {
      const invoiceDate = new Date(invoice.date);
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      switch (periodFilter) {
        case "month":
          if (invoiceDate.getMonth() !== thisMonth || invoiceDate.getFullYear() !== thisYear) {
            return false;
          }
          break;
        case "last-month":
          const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
          const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
          if (invoiceDate.getMonth() !== lastMonth || invoiceDate.getFullYear() !== lastMonthYear) {
            return false;
          }
          break;
        case "quarter":
          const quarterStart = Math.floor(thisMonth / 3) * 3;
          if (
            invoiceDate.getFullYear() !== thisYear ||
            invoiceDate.getMonth() < quarterStart ||
            invoiceDate.getMonth() >= quarterStart + 3
          ) {
            return false;
          }
          break;
        case "year":
          if (invoiceDate.getFullYear() !== thisYear) {
            return false;
          }
          break;
      }
    }
    
    // Customer filter
    if (customerFilter !== "all" && invoice.customerId !== parseInt(customerFilter)) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(search) ||
        customers?.find(c => c.id === invoice.customerId)?.name.toLowerCase().includes(search)
      );
    }
    
    return true;
  }) : [];
  
  // Sort logic
  const sortedData = [...filteredData].sort((a, b) => {
    // Sort by date (most recent first by default)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  if (error) {
    return (
      <MainLayout title="Facturen">
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Fout bij het laden van facturen</h2>
            <p className="text-gray-700">Probeer het later opnieuw.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Facturen">
      <div className="flex justify-between items-center mb-6">
        <div /> {/* Empty div for flex spacing */}
        <Button 
          className="bg-primary hover:bg-[#003A66]"
          onClick={() => {
            createForm.reset({
              customerId: 0,
              workOrderId: null,
              date: new Date(),
              dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
              amount: 0,
              status: "Concept",
              items: [],
            });
            setIsCreateDialogOpen(true);
          }}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Nieuwe factuur
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="status-facturen" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="sent">Verzonden</SelectItem>
                <SelectItem value="paid">Betaald</SelectItem>
                <SelectItem value="overdue">Te laat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="periode-facturen" className="block text-sm font-medium text-gray-700">
              Periode
            </label>
            <Select 
              value={periodFilter} 
              onValueChange={setPeriodFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Deze maand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle perioden</SelectItem>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="last-month">Afgelopen maand</SelectItem>
                <SelectItem value="quarter">Dit kwartaal</SelectItem>
                <SelectItem value="year">Dit jaar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="klant-facturen" className="block text-sm font-medium text-gray-700">
              Klant
            </label>
            <Select 
              value={customerFilter} 
              onValueChange={setCustomerFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle klanten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle klanten</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search-facturen" className="block text-sm font-medium text-gray-700">
              Zoeken
            </label>
            <Input
              type="text"
              id="search-facturen"
              placeholder="Zoek op factuurnr of klant"
              className="mt-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Invoices Table */
        <DataTable
          data={sortedData}
          columns={columns}
          totalItems={filteredData.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
        />
      )}
      
      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Nieuwe factuur toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens in om een nieuwe factuur aan te maken.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klant</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een klant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Werkbon</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een werkbon (optioneel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Geen werkbon</SelectItem>
                        {workOrders
                          .filter(wo => wo.status === "Voltooid")
                          .map((workOrder) => (
                            <SelectItem key={workOrder.id} value={workOrder.id.toString()}>
                              {workOrder.orderNumber} - {workOrder.title}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Factuurdatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd-MM-yyyy")
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vervaldatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd-MM-yyyy")
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Concept">Concept</SelectItem>
                        <SelectItem value="Verzonden">Verzonden</SelectItem>
                        <SelectItem value="Betaald">Betaald</SelectItem>
                        <SelectItem value="Te laat">Te laat</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-[#003A66]"
                  disabled={createInvoiceMutation.isPending}
                >
                  {createInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    "Opslaan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Factuur bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van de factuur.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klant</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een klant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Werkbon</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een werkbon (optioneel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Geen werkbon</SelectItem>
                        {workOrders
                          .filter(wo => wo.status === "Voltooid")
                          .map((workOrder) => (
                            <SelectItem key={workOrder.id} value={workOrder.id.toString()}>
                              {workOrder.orderNumber} - {workOrder.title}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Factuurdatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd-MM-yyyy")
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vervaldatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd-MM-yyyy")
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Concept">Concept</SelectItem>
                        <SelectItem value="Verzonden">Verzonden</SelectItem>
                        <SelectItem value="Betaald">Betaald</SelectItem>
                        <SelectItem value="Te laat">Te laat</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedInvoice(null);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-[#003A66]"
                  disabled={updateInvoiceMutation.isPending}
                >
                  {updateInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    "Opslaan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Factuur Details</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-gray-500">
                    Status: <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                      selectedInvoice.status === "Betaald" ? "bg-green-100 text-green-800" :
                      selectedInvoice.status === "Verzonden" ? "bg-blue-100 text-blue-800" :
                      selectedInvoice.status === "Te laat" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>{selectedInvoice.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Factuurdatum: {format(new Date(selectedInvoice.date), 'dd-MM-yyyy')}</p>
                  <p className="text-sm text-gray-500">Vervaldatum: {format(new Date(selectedInvoice.dueDate), 'dd-MM-yyyy')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Factuur voor</h3>
                  <p className="font-semibold">
                    {customers?.find(c => c.id === selectedInvoice.customerId)?.name || "Onbekend"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customers?.find(c => c.id === selectedInvoice.customerId)?.street || ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customers?.find(c => c.id === selectedInvoice.customerId)?.city || ""}
                  </p>
                </div>
                
                {selectedInvoice.workOrderId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Werkbon</h3>
                    <p className="font-semibold">
                      {workOrders?.find(w => w.id === selectedInvoice.workOrderId)?.orderNumber || ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {workOrders?.find(w => w.id === selectedInvoice.workOrderId)?.title || ""}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Factuurregels</h3>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Omschrijving
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aantal
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prijs
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bedrag
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.quantity * item.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            Totaal:
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(selectedInvoice.amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Geen factuurregels beschikbaar</p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Sluiten
            </Button>
            <Button
              variant="outline"
              className="text-primary hover:text-primary/90"
            >
              <FaPrint className="mr-2 h-4 w-4" /> Afdrukken
            </Button>
            <Button
              variant="outline"
              className="text-primary hover:text-primary/90"
            >
              <FaEnvelope className="mr-2 h-4 w-4" /> Versturen
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEdit(selectedInvoice!);
              }}
            >
              <FaEdit className="mr-2 h-4 w-4" /> Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Factuur verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u deze factuur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedInvoice(null);
              }}
            >
              Annuleren
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteInvoiceMutation.isPending}
            >
              {deleteInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                "Verwijderen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}