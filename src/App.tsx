import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

// Direct imports to avoid Suspense issues
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Feed from "@/pages/Feed";
import AdminLogin from "@/pages/AdminLogin";
import AdminOrders from "@/pages/AdminOrders";
import AdminCatalogue from "@/pages/AdminCatalogue";
import Catalogue from "@/pages/Catalogue";
import Dashboard from "@/pages/Dashboard";
import Earn from "@/pages/Earn";
import Settings from "@/pages/Settings";
import Partners from "@/pages/Partners";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/feed" component={Feed} />
      <Route path="/catalogue" component={Catalogue} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/earn" component={Earn} />
      <Route path="/partners" component={Partners} />
      <Route path="/admin">
        <Redirect to="/admin/login" />
      </Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/catalogue" component={AdminCatalogue} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
