import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigation } from "@/contexts/NavigationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ClipboardList, Users, Package, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Dashboard page component
export default function DashboardPage() {
  const { setActiveView } = useNavigation();
  
  // Set the active navigation item
  useEffect(() => {
    setActiveView("dashboard");
  }, [setActiveView]);
  
  // Fetch statistics
  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
    retry: 1,
    enabled: true,
    // If API endpoint doesn't exist yet, use placeholder data
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return "real" counts by querying individual endpoints
        const [workorders, customers, materials, invoices] = await Promise.all([
          fetch('/api/workorders').then(r => r.ok ? r.json() : []),
          fetch('/api/customers').then(r => r.ok ? r.json() : []),
          fetch('/api/materials').then(r => r.ok ? r.json() : []),
          fetch('/api/invoices').then(r => r.ok ? r.json() : []),
        ]);

        return {
          totalWorkOrders: workorders.length,
          totalCustomers: customers.length,
          totalMaterials: materials.length,
          totalInvoices: invoices.length,
          workOrdersByStatus: {
            nieuw: workorders.filter((wo: any) => wo.status === 'Nieuw').length,
            inBehandeling: workorders.filter((wo: any) => wo.status === 'In behandeling').length,
            voltooid: workorders.filter((wo: any) => wo.status === 'Voltooid').length
          },
          invoicesByStatus: {
            concept: invoices.filter((inv: any) => inv.status === 'Concept').length,
            verzonden: invoices.filter((inv: any) => inv.status === 'Verzonden').length,
            betaald: invoices.filter((inv: any) => inv.status === 'Betaald').length,
            teLaat: invoices.filter((inv: any) => inv.status === 'Te laat').length
          },
          recentInvoices: invoices.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
          lowStockMaterials: materials.filter((m: any) => m.stock && m.minStock && m.stock <= m.minStock).slice(0, 5),
          monthlyRevenue: [
            { month: 'Jan', amount: calculateMonthlyRevenue(invoices, 0) },
            { month: 'Feb', amount: calculateMonthlyRevenue(invoices, 1) },
            { month: 'Mrt', amount: calculateMonthlyRevenue(invoices, 2) },
            { month: 'Apr', amount: calculateMonthlyRevenue(invoices, 3) },
            { month: 'Mei', amount: calculateMonthlyRevenue(invoices, 4) },
            { month: 'Jun', amount: calculateMonthlyRevenue(invoices, 5) },
            { month: 'Jul', amount: calculateMonthlyRevenue(invoices, 6) },
            { month: 'Aug', amount: calculateMonthlyRevenue(invoices, 7) },
            { month: 'Sep', amount: calculateMonthlyRevenue(invoices, 8) },
            { month: 'Okt', amount: calculateMonthlyRevenue(invoices, 9) },
            { month: 'Nov', amount: calculateMonthlyRevenue(invoices, 10) },
            { month: 'Dec', amount: calculateMonthlyRevenue(invoices, 11) },
          ]
        };
      }
    }
  });
  
  // Fetch recent work orders
  const { 
    data: recentWorkOrders = [], 
    isLoading: isWorkOrdersLoading 
  } = useQuery<any[]>({
    queryKey: ['/api/workorders', { recent: true }],
    retry: 1,
    // Transform the data to get only the most recent 5 work orders
    select: (data) => {
      return data
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    }
  });
  
  // Fetch customers for reference
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
    retry: 1,
  });
  
  // Generate colors for the pie chart
  const COLORS = ['#008037', '#0088FE', '#FFBB28', '#FF8042'];
  
  // Is loading any data
  const isLoading = isStatsLoading || isWorkOrdersLoading;
  
  // Calculate chart data for work order status
  const workOrderStatusData = stats ? [
    { name: 'Nieuw', value: stats.workOrdersByStatus?.nieuw || 0 },
    { name: 'In behandeling', value: stats.workOrdersByStatus?.inBehandeling || 0 },
    { name: 'Voltooid', value: stats.workOrdersByStatus?.voltooid || 0 },
  ] : [];
  
  // Calculate chart data for invoice status
  const invoiceStatusData = stats ? [
    { name: 'Concept', value: stats.invoicesByStatus?.concept || 0 },
    { name: 'Verzonden', value: stats.invoicesByStatus?.verzonden || 0 },
    { name: 'Betaald', value: stats.invoicesByStatus?.betaald || 0 },
    { name: 'Te laat', value: stats.invoicesByStatus?.teLaat || 0 },
  ] : [];
  
  return (
    <MainLayout title="Dashboard">
      {isLoading ? (
        <div className="flex justify-center items-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Werkbonnen</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalWorkOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.workOrdersByStatus?.nieuw || 0} nieuwe, {stats?.workOrdersByStatus?.inBehandeling || 0} in behandeling
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Klanten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Totaal aantal klanten in het systeem
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materialen</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMaterials || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.lowStockMaterials?.length || 0} artikelen met lage voorraad
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturen</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.invoicesByStatus?.verzonden || 0} verzonden, {stats?.invoicesByStatus?.teLaat || 0} te laat
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly revenue chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Maandelijkse Omzet</CardTitle>
                <CardDescription>Overzicht van de omzet per maand</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={stats?.monthlyRevenue || []}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" fill="#008037" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Status distribution charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Werkbonnen Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workOrderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workOrderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Aantal']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Facturen Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {invoiceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Aantal']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Bottom row: Recent entities and alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent work orders */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Recente Werkbonnen</CardTitle>
                <CardDescription>De laatste werkbonnen in het systeem</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {recentWorkOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentWorkOrders.map((workOrder) => (
                      <div key={workOrder.id} className="flex items-center p-2 hover:bg-muted rounded-md">
                        <div className="mr-2">
                          {workOrder.status === 'Nieuw' && <Clock className="h-5 w-5 text-blue-500" />}
                          {workOrder.status === 'In behandeling' && <Clock className="h-5 w-5 text-orange-500" />}
                          {workOrder.status === 'Voltooid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{workOrder.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {workOrder.orderNumber} - {customers?.find(c => c.id === workOrder.customerId)?.name || 'Onbekende klant'}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            workOrder.status === 'Nieuw' ? 'bg-blue-100 text-blue-800' :
                            workOrder.status === 'In behandeling' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {workOrder.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Geen recente werkbonnen gevonden</p>
                )}
                <Separator className="my-4" />
                <div className="flex justify-center">
                  <Link href="/werkbonnen">
                    <Button variant="outline">Alle Werkbonnen Bekijken</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Low stock materials */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Lage Voorraad</CardTitle>
                <CardDescription>Materialen die bijbesteld moeten worden</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {stats?.lowStockMaterials && stats.lowStockMaterials.length > 0 ? (
                  <div className="space-y-4">
                    {stats.lowStockMaterials.map((material: any) => (
                      <div key={material.id} className="flex items-center p-2 hover:bg-muted rounded-md">
                        <div className="mr-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{material.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Artikel: {material.articleNumber}
                          </p>
                        </div>
                        <div>
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {material.stock}/{material.minStock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Geen materialen met lage voorraad</p>
                )}
                <Separator className="my-4" />
                <div className="flex justify-center">
                  <Link href="/materialen">
                    <Button variant="outline">Materialen Beheren</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent invoices */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Recente Facturen</CardTitle>
                <CardDescription>De laatste facturen in het systeem</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentInvoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center p-2 hover:bg-muted rounded-md">
                        <div className="mr-2">
                          {invoice.status === 'Betaald' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {invoice.status === 'Verzonden' && <Clock className="h-5 w-5 text-blue-500" />}
                          {invoice.status === 'Concept' && <FileText className="h-5 w-5 text-gray-500" />}
                          {invoice.status === 'Te laat' && <AlertCircle className="h-5 w-5 text-red-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {customers?.find(c => c.id === invoice.customerId)?.name || 'Onbekende klant'} - {formatCurrency(invoice.amount)}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === 'Betaald' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'Verzonden' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'Te laat' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Geen recente facturen gevonden</p>
                )}
                <Separator className="my-4" />
                <div className="flex justify-center">
                  <Link href="/facturen">
                    <Button variant="outline">Alle Facturen Bekijken</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// Helper function to calculate monthly revenue
function calculateMonthlyRevenue(invoices: any[], month: number): number {
  const currentYear = new Date().getFullYear();
  return invoices
    .filter((inv: any) => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === month && invDate.getFullYear() === currentYear && inv.status !== 'Concept';
    })
    .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
}