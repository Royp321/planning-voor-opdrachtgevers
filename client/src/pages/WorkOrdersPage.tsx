import { useEffect, useState, useRef } from "react";
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
import { FaEdit, FaFileAlt, FaTrash, FaPlus, FaCheck, FaUpload, FaCamera } from "react-icons/fa";
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDate } from "@/lib/utils";
import { WorkOrder } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Schema voor het aanmaken/bewerken van werkbonnen
const workOrderSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().optional().nullable(),
  customerId: z.number().int().min(1, "Klant is verplicht"),
  status: z.string().min(1, "Status is verplicht"),
  date: z.date(),
  notes: z.string().optional().nullable(),
  laborHours: z.number().min(0).optional().nullable(),
  materials: z.array(z.object({
    id: z.number(),
    quantity: z.number(),
    name: z.string(),
    price: z.number()
  })).optional().nullable(),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export default function WorkOrdersPage() {
  const { setActiveView } = useNavigation();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("week");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<number | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [workOrderToComplete, setWorkOrderToComplete] = useState<WorkOrder | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch work orders from API
  const { data: workOrders, isLoading, refetch } = useQuery<WorkOrder[]>({
    queryKey: ['/api/workorders'],
    retry: 1,
  });

  // Fetch customers for the dropdown
  const { data: customers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
    retry: 1,
  });

  // Form for creating/editing work orders
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      customerId: 0,
      status: "Ingepland",
      date: new Date(),
      notes: "",
      laborHours: 0,
      materials: [],
    },
  });

  // Mutation for creating a work order
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormValues) => {
      const response = await apiRequest("POST", "/api/workorders", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Werkbon aangemaakt",
        description: "De werkbon is succesvol aangemaakt",
      });
      setWorkOrderDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/workorders'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken werkbon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a work order
  const updateWorkOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<WorkOrderFormValues> }) => {
      const response = await apiRequest("PUT", `/api/workorders/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Werkbon bijgewerkt",
        description: "De werkbon is succesvol bijgewerkt",
      });
      setWorkOrderDialogOpen(false);
      setEditingWorkOrder(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/workorders'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken werkbon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a work order
  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workorders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Werkbon verwijderd",
        description: "De werkbon is succesvol verwijderd",
      });
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workorders'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen werkbon",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for completing a work order
  const completeWorkOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { photos: string[], notes: string, laborHours: number } }) => {
      const response = await apiRequest("PUT", `/api/workorders/${id}/complete`, {
        ...data,
        status: "Voltooid"
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Werkbon afgemeld",
        description: "De werkbon is succesvol afgemeld",
      });
      setCompleteDialogOpen(false);
      setWorkOrderToComplete(null);
      setUploadedPhotos([]);
      queryClient.invalidateQueries({ queryKey: ['/api/workorders'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij afmelden werkbon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: WorkOrderFormValues) => {
    if (editingWorkOrder) {
      updateWorkOrderMutation.mutate({ id: editingWorkOrder.id as number, data });
    } else {
      createWorkOrderMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    form.reset({
      title: workOrder.title,
      description: workOrder.description,
      customerId: workOrder.customerId,
      status: workOrder.status,
      date: new Date(workOrder.date),
      notes: workOrder.notes,
      laborHours: workOrder.laborHours,
      materials: workOrder.materials as any[] || [],
    });
    setWorkOrderDialogOpen(true);
  };

  // Handle view details button click
  const handleViewDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setViewDetailsDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setWorkOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle complete work order button click
  const handleCompleteWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrderToComplete(workOrder);
    setUploadedPhotos([]);
    setCompleteDialogOpen(true);
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process each file
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo from uploaded photos
  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit complete work order form
  const handleCompleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workOrderToComplete) return;

    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string || '';
    const laborHours = parseFloat(formData.get('laborHours') as string) || 0;

    completeWorkOrderMutation.mutate({
      id: workOrderToComplete.id as number,
      data: {
        notes,
        laborHours,
        photos: uploadedPhotos
      }
    });
  };

  // Reset form when dialog is closed
  const handleDialogClose = () => {
    form.reset();
    setEditingWorkOrder(null);
    setWorkOrderDialogOpen(false);
  };

  // Reset form for a new work order
  const handleNewWorkOrder = () => {
    setEditingWorkOrder(null);
    form.reset({
      title: "",
      description: "",
      customerId: 0,
      status: "Ingepland",
      date: new Date(),
      notes: "",
      laborHours: 0,
      materials: [],
    });
    setWorkOrderDialogOpen(true);
  };

  useEffect(() => {
    setActiveView("werkbonnen");
  }, [setActiveView]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Table columns configuration
  const columns = [
    {
      header: "Werkbon nr.",
      accessorKey: "orderNumber",
      cell: (row: WorkOrder) => (
        <span className="text-sm font-medium text-primary">{row.orderNumber || `WO-${row.id}`}</span>
      ),
    },
    {
      header: "Klant",
      accessorKey: "customer",
      cell: (row: WorkOrder) => {
        const customer = customers?.find(c => c.id === row.customerId);
        return <span className="text-sm text-gray-500">{customer?.name || "Onbekend"}</span>;
      },
    },
    {
      header: "Omschrijving",
      accessorKey: "description",
      cell: (row: WorkOrder) => (
        <span className="text-sm text-gray-500 max-w-xs truncate">
          {row.description}
        </span>
      ),
    },
    {
      header: "Datum",
      accessorKey: "date",
      cell: (row: WorkOrder) => (
        <span className="text-sm text-gray-500">
          {row.date ? format(new Date(row.date), 'dd-MM-yyyy') : 'Onbekend'}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: WorkOrder) => {
        let statusClass = "";
        switch (row.status) {
          case "Voltooid":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "In uitvoering":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Ingepland":
            statusClass = "bg-blue-100 text-blue-800";
            break;
          case "Geannuleerd":
            statusClass = "bg-red-100 text-red-800";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
        }
        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Acties",
      accessorKey: (row: WorkOrder) => (
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <FaEdit />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-2"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
          >
            <FaFileAlt />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-green-600 hover:text-green-800 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCompleteWorkOrder(row);
            }}
          >
            <FaCheck />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-800"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id as number);
            }}
          >
            <FaTrash />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  // Filter work orders based on filters
  const filteredData = workOrders ? workOrders.filter((workOrder: WorkOrder) => {
    // Filter by status
    if (statusFilter !== "all") {
      const statusMap = {
        "open": "Ingepland",
        "in-progress": "In uitvoering",
        "completed": "Voltooid",
        "cancelled": "Geannuleerd"
      };
      if (workOrder.status !== statusMap[statusFilter as keyof typeof statusMap]) {
        return false;
      }
    }

    // Filter by customer
    if (customerFilter !== "all" && workOrder.customerId !== parseInt(customerFilter)) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderNumberLower = (workOrder.orderNumber || `WO-${workOrder.id}`).toLowerCase();
      const descriptionLower = workOrder.description?.toLowerCase() || '';
      
      if (!orderNumberLower.includes(searchLower) && !descriptionLower.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }) : [];

  return (
    <MainLayout title="Werkbonnen">
      <div className="flex justify-between items-center mb-6">
        <div /> {/* Empty div for flex spacing */}
        <Button 
          className="bg-primary hover:bg-[#003A66]"
          onClick={handleNewWorkOrder}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Nieuwe werkbon
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
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
                <SelectItem value="open">Ingepland</SelectItem>
                <SelectItem value="in-progress">In uitvoering</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
              Periode
            </label>
            <Select 
              value={dateFilter} 
              onValueChange={setDateFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Deze week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Deze week</SelectItem>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="last-month">Afgelopen maand</SelectItem>
                <SelectItem value="year">Dit jaar</SelectItem>
                <SelectItem value="custom">Aangepaste periode</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="klant-filter" className="block text-sm font-medium text-gray-700">
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
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search-werkbon" className="block text-sm font-medium text-gray-700">
              Zoeken
            </label>
            <Input
              type="text"
              id="search-werkbon"
              placeholder="Zoek op nummer of beschrijving"
              className="mt-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Work Orders Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={filteredData || []}
          columns={columns}
          totalItems={filteredData?.length || 0}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
        />
      )}
      
      {/* Create/Edit Work Order Dialog */}
      <Dialog open={workOrderDialogOpen} onOpenChange={setWorkOrderDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingWorkOrder ? "Werkbon Bewerken" : "Nieuwe Werkbon"}
            </DialogTitle>
            <DialogDescription>
              {editingWorkOrder 
                ? "Bewerk de details van de werkbon en klik op Opslaan."
                : "Vul de details van de nieuwe werkbon in en klik op Aanmaken."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klant</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een klant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer: any) => (
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
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Titel van de werkbon"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Beschrijf de werkzaamheden"
                        className="resize-none"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Datum</FormLabel>
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
                                format(field.value, "PPP")
                              ) : (
                                <span>Kies een datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ingepland">Ingepland</SelectItem>
                          <SelectItem value="In uitvoering">In uitvoering</SelectItem>
                          <SelectItem value="Voltooid">Voltooid</SelectItem>
                          <SelectItem value="Geannuleerd">Geannuleerd</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="laborHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gewerkte uren</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Aanvullende notities"
                        className="resize-none"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleDialogClose}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending}
                >
                  {(createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingWorkOrder ? "Opslaan" : "Aanmaken"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Work Order Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Werkbon Details</DialogTitle>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Werkbon Nummer</h3>
                  <p className="text-primary font-semibold">{selectedWorkOrder.orderNumber || `WO-${selectedWorkOrder.id}`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Datum</h3>
                  <p>{format(new Date(selectedWorkOrder.date), 'dd-MM-yyyy')}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Klant</h3>
                <p>{customers?.find(c => c.id === selectedWorkOrder.customerId)?.name || "Onbekend"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Omschrijving</h3>
                <p>{selectedWorkOrder.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <p>{selectedWorkOrder.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Gewerkte uren</h3>
                  <p>{selectedWorkOrder.laborHours || 0} uren</p>
                </div>
              </div>
              
              {selectedWorkOrder.notes && (
                <div>
                  <h3 className="text-sm font-medium">Notities</h3>
                  <p>{selectedWorkOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setViewDetailsDialogOpen(false)}
            >
              Sluiten
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (selectedWorkOrder) {
                  setViewDetailsDialogOpen(false);
                  handleEdit(selectedWorkOrder);
                }
              }}
            >
              <FaEdit className="mr-2 h-4 w-4" /> Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verwijder Werkbon</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze werkbon wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (workOrderToDelete !== null) {
                  deleteWorkOrderMutation.mutate(workOrderToDelete);
                }
              }}
              disabled={deleteWorkOrderMutation.isPending}
            >
              {deleteWorkOrderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Work Order Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Werkbon afmelden</DialogTitle>
            <DialogDescription>
              Vul de details in om de werkbon af te melden als voltooid.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            {workOrderToComplete && (
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="text-sm font-medium">Werkbon Nummer</h3>
                  <p className="text-primary font-semibold">{workOrderToComplete.orderNumber || `WO-${workOrderToComplete.id}`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Klant</h3>
                  <p className="text-gray-500">
                    {customers?.find(c => c.id === workOrderToComplete.customerId)?.name || "Onbekend"}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="laborHours" className="block text-sm font-medium text-gray-700">
                Gewerkte uren
              </label>
              <Input
                type="number"
                id="laborHours"
                name="laborHours"
                min="0"
                step="0.5"
                defaultValue={workOrderToComplete?.laborHours || 0}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notities / Opmerkingen
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Voeg hier eventuele notities of opmerkingen toe"
                className="mt-1 resize-none h-24"
                defaultValue={workOrderToComplete?.notes || ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto's toevoegen
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <FaCamera /> Foto nemen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <FaUpload /> Uploaden
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  multiple
                  className="hidden"
                />
              </div>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Geüploade foto's ({uploadedPhotos.length})</h3>
                <div className="grid grid-cols-3 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Uploaded photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <FaTrash size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCompleteDialogOpen(false);
                  setUploadedPhotos([]);
                }}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={completeWorkOrderMutation.isPending}
              >
                {completeWorkOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Werkbon afmelden
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
