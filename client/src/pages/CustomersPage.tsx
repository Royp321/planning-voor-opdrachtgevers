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
import { FaUser, FaBuilding, FaEdit, FaFileAlt, FaTrash, FaPlus } from "react-icons/fa";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Customer } from "@shared/schema";

// Schema voor het aanmaken/bewerken van klanten
const customerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  street: z.string().min(1, "Straat is verplicht"),
  city: z.string().min(1, "Plaats is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").min(1, "E-mail is verplicht"),
  phone: z.string().min(1, "Telefoonnummer is verplicht"),
  type: z.enum(["Particulier", "Zakelijk"]),
  status: z.enum(["Actief", "Inactief"]),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { setActiveView } = useNavigation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("name-asc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Fetch customers
  const { 
    data: customers = [], 
    isLoading,
    error 
  } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van klanten');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
    }
  });
  
  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const response = await apiRequest('POST', '/api/customers', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Klant aangemaakt",
        description: "De klant is succesvol aangemaakt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het aanmaken van de klant: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CustomerFormValues }) => {
      const response = await apiRequest('PUT', `/api/customers/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Klant bijgewerkt",
        description: "De klant is succesvol bijgewerkt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het bijwerken van de klant: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Klant verwijderd",
        description: "De klant is succesvol verwijderd.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het verwijderen van de klant: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form handlers
  const createForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      street: "",
      city: "",
      email: "",
      phone: "",
      type: "Particulier",
      status: "Actief",
    },
  });
  
  const editForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: selectedCustomer?.name || "",
      street: selectedCustomer?.street || "",
      city: selectedCustomer?.city || "",
      email: selectedCustomer?.email || "",
      phone: selectedCustomer?.phone || "",
      type: (selectedCustomer?.type as "Particulier" | "Zakelijk") || "Particulier",
      status: (selectedCustomer?.status as "Actief" | "Inactief") || "Actief",
    },
  });
  
  // Sync form values when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      editForm.reset({
        name: selectedCustomer.name || "",
        street: selectedCustomer.street || "",
        city: selectedCustomer.city || "",
        email: selectedCustomer.email || "",
        phone: selectedCustomer.phone || "",
        type: (selectedCustomer.type as "Particulier" | "Zakelijk") || "Particulier",
        status: (selectedCustomer.status as "Actief" | "Inactief") || "Actief",
      });
    }
  }, [selectedCustomer, editForm]);
  
  useEffect(() => {
    setActiveView("klanten");
  }, [setActiveView]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCreateSubmit = (data: CustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: CustomerFormValues) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (selectedCustomer) {
      deleteCustomerMutation.mutate(selectedCustomer.id);
    }
  };
  
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  // Table columns configuration
  const columns = [
    {
      header: "Naam",
      accessorKey: (row: Customer) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-[#EBF5FF] text-primary rounded-full">
            {row.type === "Particulier" ? <FaUser /> : <FaBuilding />}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">Klantnr: {row.customerNumber}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Adres",
      accessorKey: (row: Customer) => (
        <div>
          <div className="text-sm text-gray-900">{row.street}</div>
          <div className="text-sm text-gray-500">{row.city}</div>
        </div>
      ),
    },
    {
      header: "Contactgegevens",
      accessorKey: (row: Customer) => (
        <div>
          <div className="text-sm text-gray-900">{row.email}</div>
          <div className="text-sm text-gray-500">{row.phone}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (row: Customer) => (
        <span className="text-sm text-gray-500">{row.type}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Customer) => {
        const statusClass = row.status === "Actief" 
          ? "bg-green-100 text-green-800" 
          : "bg-gray-100 text-gray-800";
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Acties",
      accessorKey: (row: Customer) => (
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-3"
            onClick={() => handleEdit(row)}
          >
            <FaEdit />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-[#003A66] mr-3"
          >
            <FaFileAlt />
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
  const filteredData = customers ? customers.filter((customer: Customer) => {
    // Type filter
    if (typeFilter !== "all") {
      const filterType = typeFilter === "private" ? "Particulier" : "Zakelijk";
      if (customer.type !== filterType) return false;
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const filterStatus = statusFilter === "active" ? "Actief" : "Inactief";
      if (customer.status !== filterStatus) return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(search) ||
        customer.street.toLowerCase().includes(search) ||
        customer.city.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search)
      );
    }
    
    return true;
  }) : [];
  
  // Sort logic
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "recent":
        // Assuming createdAt is available
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });
  
  if (error) {
    return (
      <MainLayout title="Klanten">
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Fout bij het laden van klanten</h2>
            <p className="text-gray-700">Probeer het later opnieuw.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Klanten">
      <div className="flex justify-between items-center mb-6">
        <div /> {/* Empty div for flex spacing */}
        <Button 
          className="bg-primary hover:bg-[#003A66]"
          onClick={() => {
            createForm.reset({
              name: "",
              street: "",
              city: "",
              email: "",
              phone: "",
              type: "Particulier",
              status: "Actief",
            });
            setIsCreateDialogOpen(true);
          }}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Nieuwe klant
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="sort-klanten" className="block text-sm font-medium text-gray-700">
              Sorteren op
            </label>
            <Select 
              value={sortBy} 
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Naam (A-Z)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Naam (A-Z)</SelectItem>
                <SelectItem value="name-desc">Naam (Z-A)</SelectItem>
                <SelectItem value="recent">Meest recente</SelectItem>
                <SelectItem value="oldest">Eerste toegevoegd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="type-klanten" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <Select 
              value={typeFilter} 
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle types</SelectItem>
                <SelectItem value="private">Particulier</SelectItem>
                <SelectItem value="business">Zakelijk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="status-klanten" className="block text-sm font-medium text-gray-700">
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
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search-klanten" className="block text-sm font-medium text-gray-700">
              Zoeken
            </label>
            <Input
              type="text"
              id="search-klanten"
              placeholder="Zoek op naam of adres"
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
        /* Customers Table */
        <DataTable
          data={sortedData}
          columns={columns}
          totalItems={filteredData.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
        />
      )}
      
      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens in om een nieuwe klant aan te maken.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bedrijfsnaam of persoonsnaam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straat</FormLabel>
                    <FormControl>
                      <Input placeholder="Straatnaam en huisnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plaats</FormLabel>
                    <FormControl>
                      <Input placeholder="Postcode en plaats" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="E-mailadres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefoonnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Particulier">Particulier</SelectItem>
                        <SelectItem value="Zakelijk">Zakelijk</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Actief">Actief</SelectItem>
                        <SelectItem value="Inactief">Inactief</SelectItem>
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
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? (
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
      
      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Klant bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van de klant.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bedrijfsnaam of persoonsnaam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straat</FormLabel>
                    <FormControl>
                      <Input placeholder="Straatnaam en huisnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plaats</FormLabel>
                    <FormControl>
                      <Input placeholder="Postcode en plaats" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="E-mailadres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefoonnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Particulier">Particulier</SelectItem>
                        <SelectItem value="Zakelijk">Zakelijk</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Actief">Actief</SelectItem>
                        <SelectItem value="Inactief">Inactief</SelectItem>
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
                    setSelectedCustomer(null);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-[#003A66]"
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? (
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Klant verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u deze klant wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Annuleren
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? (
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