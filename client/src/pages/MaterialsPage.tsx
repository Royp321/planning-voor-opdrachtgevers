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
import { FaBolt, FaFire, FaTint, FaEdit, FaBox, FaTrash, FaPlus } from "react-icons/fa";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Material } from "@shared/schema";

// Schema voor het aanmaken/bewerken van materialen
const materialSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  brand: z.string().min(1, "Merk is verplicht"),
  category: z.string().min(1, "Categorie is verplicht"),
  price: z.number().min(0, "Prijs moet 0 of hoger zijn"),
  stock: z.number().min(0, "Voorraad moet 0 of hoger zijn"),
  minStock: z.number().min(0, "Minimale voorraad moet 0 of hoger zijn"),
  supplier: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function MaterialsPage() {
  const { setActiveView } = useNavigation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Fetch materials
  const { 
    data: materials = [], 
    isLoading,
    error 
  } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/materials');
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van materialen');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching materials:', error);
        throw error;
      }
    }
  });
  
  // Mutations
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      const response = await apiRequest('POST', '/api/materials', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Materiaal aangemaakt",
        description: "Het materiaal is succesvol aangemaakt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het aanmaken van het materiaal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: MaterialFormValues }) => {
      const response = await apiRequest('PUT', `/api/materials/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Materiaal bijgewerkt",
        description: "Het materiaal is succesvol bijgewerkt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het bijwerken van het materiaal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/materials/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Materiaal verwijderd",
        description: "Het materiaal is succesvol verwijderd.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: `Fout bij het verwijderen van het materiaal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form handlers
  const createForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "Elektra",
      price: 0,
      stock: 0,
      minStock: 0,
      supplier: "",
    },
  });
  
  const editForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: selectedMaterial?.name || "",
      brand: selectedMaterial?.brand || "",
      category: selectedMaterial?.category || "Elektra",
      price: selectedMaterial?.price || 0,
      stock: selectedMaterial?.stock || 0,
      minStock: selectedMaterial?.minStock || 0,
      supplier: selectedMaterial?.supplier || "",
    },
  });
  
  // Sync form values when selectedMaterial changes
  useEffect(() => {
    if (selectedMaterial) {
      editForm.reset({
        name: selectedMaterial.name,
        brand: selectedMaterial.brand || "",
        category: selectedMaterial.category,
        price: selectedMaterial.price,
        stock: selectedMaterial.stock,
        minStock: selectedMaterial.minStock,
        supplier: selectedMaterial.supplier || "",
      });
    }
  }, [selectedMaterial, editForm]);
  
  useEffect(() => {
    setActiveView("materialen");
  }, [setActiveView]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCreateSubmit = (data: MaterialFormValues) => {
    createMaterialMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: MaterialFormValues) => {
    if (selectedMaterial) {
      updateMaterialMutation.mutate({ id: selectedMaterial.id, data });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (selectedMaterial) {
      deleteMaterialMutation.mutate(selectedMaterial.id);
    }
  };
  
  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };
  
  const getIconForMaterial = (category: string) => {
    switch (category.toLowerCase()) {
      case "elektra":
        return <FaBolt className="text-primary" />;
      case "verwarming":
        return <FaFire className="text-primary" />;
      case "sanitair":
        return <FaTint className="text-primary" />;
      default:
        return <FaBox className="text-primary" />;
    }
  };

  // Stockstatus bepalen
  const getStockStatus = (material: Material) => {
    if (material.stock <= 0) {
      return "Niet op voorraad";
    } else if (material.stock < material.minStock) {
      return "Bijna op";
    } else {
      return "Op voorraad";
    }
  };
  
  // Table columns configuration
  const columns = [
    {
      header: "Artikelnr.",
      accessorKey: "articleNumber",
      cell: (row: Material) => (
        <span className="text-sm font-medium text-primary">{row.articleNumber}</span>
      ),
    },
    {
      header: "Naam",
      accessorKey: (row: Material) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
            {getIconForMaterial(row.category)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">Merk: {row.brand}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Categorie",
      accessorKey: "category",
      cell: (row: Material) => (
        <span className="text-sm text-gray-500">{row.category}</span>
      ),
    },
    {
      header: "Prijs",
      accessorKey: "price",
      cell: (row: Material) => (
        <span className="text-sm text-gray-500">{formatCurrency(row.price)}</span>
      ),
    },
    {
      header: "Voorraad",
      accessorKey: "stock",
      cell: (row: Material) => {
        const stockStatus = getStockStatus(row);
        let statusClass = "";
        switch (stockStatus) {
          case "Op voorraad":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "Bijna op":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Niet op voorraad":
            statusClass = "bg-red-100 text-red-800";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {row.stock} stuks
          </span>
        );
      },
    },
    {
      header: "Acties",
      accessorKey: (row: Material) => (
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
            <FaBox />
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
  const filteredData = materials ? materials.filter((material: Material) => {
    // Category filter
    if (categoryFilter !== "all") {
      const categoryMap: Record<string, string> = {
        "electric": "Elektra",
        "heating": "Verwarming",
        "sanitary": "Sanitair",
        "install": "Installatiemateriaal"
      };
      if (material.category !== categoryMap[categoryFilter]) {
        return false;
      }
    }
    
    // Stock filter
    if (stockFilter !== "all") {
      const stockStatus = getStockStatus(material);
      const statusMap: Record<string, string> = {
        "in-stock": "Op voorraad",
        "low-stock": "Bijna op",
        "out-of-stock": "Niet op voorraad"
      };
      if (stockStatus !== statusMap[stockFilter]) {
        return false;
      }
    }
    
    // Supplier filter
    if (supplierFilter !== "all" && material.supplier !== supplierFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        material.name.toLowerCase().includes(search) ||
        material.articleNumber.toLowerCase().includes(search) ||
        material.brand?.toLowerCase().includes(search) ||
        material.category.toLowerCase().includes(search)
      );
    }
    
    return true;
  }) : [];
  
  // Sort logic
  const sortedData = [...filteredData];
  
  if (error) {
    return (
      <MainLayout title="Materialen">
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Fout bij het laden van materialen</h2>
            <p className="text-gray-700">Probeer het later opnieuw.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Materialen">
      <div className="flex justify-between items-center mb-6">
        <div /> {/* Empty div for flex spacing */}
        <Button 
          className="bg-primary hover:bg-[#003A66]"
          onClick={() => {
            createForm.reset({
              name: "",
              brand: "",
              category: "Elektra",
              price: 0,
              stock: 0,
              minStock: 0,
              supplier: "",
            });
            setIsCreateDialogOpen(true);
          }}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Nieuw materiaal
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="categorie-filter" className="block text-sm font-medium text-gray-700">
              Categorie
            </label>
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle categorieën" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                <SelectItem value="install">Installatiemateriaal</SelectItem>
                <SelectItem value="sanitary">Sanitair</SelectItem>
                <SelectItem value="heating">Verwarming</SelectItem>
                <SelectItem value="electric">Elektra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="voorraad-filter" className="block text-sm font-medium text-gray-700">
              Voorraadstatus
            </label>
            <Select 
              value={stockFilter} 
              onValueChange={setStockFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="in-stock">Op voorraad</SelectItem>
                <SelectItem value="low-stock">Bijna op</SelectItem>
                <SelectItem value="out-of-stock">Niet op voorraad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="leverancier-filter" className="block text-sm font-medium text-gray-700">
              Leverancier
            </label>
            <Select 
              value={supplierFilter} 
              onValueChange={setSupplierFilter}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Alle leveranciers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle leveranciers</SelectItem>
                {Array.from(new Set(materials.map(m => m.supplier))).filter(Boolean).map(
                  (supplier) => supplier && (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search-materialen" className="block text-sm font-medium text-gray-700">
              Zoeken
            </label>
            <Input
              type="text"
              id="search-materialen"
              placeholder="Zoek op naam of artikelnummer"
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
        /* Materials Table */
        <DataTable
          data={sortedData}
          columns={columns}
          totalItems={filteredData.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
        />
      )}
      
      {/* Create Material Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuw materiaal toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens in om een nieuw materiaal toe te voegen.
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
                      <Input placeholder="Naam van het materiaal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merk</FormLabel>
                    <FormControl>
                      <Input placeholder="Merk van het materiaal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Elektra">Elektra</SelectItem>
                        <SelectItem value="Verwarming">Verwarming</SelectItem>
                        <SelectItem value="Sanitair">Sanitair</SelectItem>
                        <SelectItem value="Installatiemateriaal">Installatiemateriaal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prijs (€)</FormLabel>
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voorraad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimale voorraad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leverancier</FormLabel>
                    <FormControl>
                      <Input placeholder="Naam van de leverancier" {...field} />
                    </FormControl>
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
                  disabled={createMaterialMutation.isPending}
                >
                  {createMaterialMutation.isPending ? (
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
      
      {/* Edit Material Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Materiaal bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van het materiaal.
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
                      <Input placeholder="Naam van het materiaal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merk</FormLabel>
                    <FormControl>
                      <Input placeholder="Merk van het materiaal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Elektra">Elektra</SelectItem>
                        <SelectItem value="Verwarming">Verwarming</SelectItem>
                        <SelectItem value="Sanitair">Sanitair</SelectItem>
                        <SelectItem value="Installatiemateriaal">Installatiemateriaal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prijs (€)</FormLabel>
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voorraad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimale voorraad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leverancier</FormLabel>
                    <FormControl>
                      <Input placeholder="Naam van de leverancier" {...field} />
                    </FormControl>
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
                    setSelectedMaterial(null);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-[#003A66]"
                  disabled={updateMaterialMutation.isPending}
                >
                  {updateMaterialMutation.isPending ? (
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
            <DialogTitle>Materiaal verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u dit materiaal wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedMaterial(null);
              }}
            >
              Annuleren
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMaterialMutation.isPending}
            >
              {deleteMaterialMutation.isPending ? (
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