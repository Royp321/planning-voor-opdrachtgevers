import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkOrdersPage from "@/pages/WorkOrdersPage";
import CustomersPage from "@/pages/CustomersPage";
import MaterialsPage from "@/pages/MaterialsPage";
import InvoicesPage from "@/pages/InvoicesPage";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Component die de routes beheert en afhankelijk is van auth status
const AuthAwareRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {() => (user ? <Redirect to="/" /> : <AuthPage />)}
      </Route>
      
      <Route path="/">
        {() => (!user ? <Redirect to="/auth" /> : <DashboardPage />)}
      </Route>
      
      <Route path="/werkbonnen">
        {() => (!user ? <Redirect to="/auth" /> : <WorkOrdersPage />)}
      </Route>
      
      <Route path="/klanten">
        {() => (!user ? <Redirect to="/auth" /> : <CustomersPage />)}
      </Route>
      
      <Route path="/materialen">
        {() => (!user ? <Redirect to="/auth" /> : <MaterialsPage />)}
      </Route>
      
      <Route path="/facturen">
        {() => (!user ? <Redirect to="/auth" /> : <InvoicesPage />)}
      </Route>
      
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
};

// Hoofd App component met alle providers
function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AuthAwareRoutes />
        <Toaster />
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
