import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Order, CatalogueOrder, CatalogueOrderItem } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, LogOut, RefreshCw, Download, Database } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

export default function AdminOrders() {
  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCatalogueOrder, setSelectedCatalogueOrder] = useState<{ order: CatalogueOrder, items: CatalogueOrderItem[] } | null>(null);
  const [viewCatalogueOrders, setViewCatalogueOrders] = useState(false);
  const [isDownloadingStorage, setIsDownloadingStorage] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { adminLogout, isAdmin } = useAuth();

  // Fetch standard orders query
  const {
    data: ordersResponse,
    isLoading: isStandardLoading,
    error: standardError,
    refetch: refetchStandard
  } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/orders");

      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch orders");
      }

      return response.json();
    },
  });

  // Fetch catalogue orders query
  const {
    data: catalogueOrdersResponse,
    isLoading: isCatalogueLoading,
    error: catalogueError,
    refetch: refetchCatalogue
  } = useQuery<{ orders: CatalogueOrder[] }>({
    queryKey: ["/api/admin/catalogue-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/catalogue-orders");

      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch catalogue orders");
      }

      return response.json();
    },
  });

  // Extract orders array from the responses
  const orders = ordersResponse?.orders || [];
  const catalogueOrders = catalogueOrdersResponse?.orders || [];

  // Update standard order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Order status has been successfully updated",
      });
      refetchStandard();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Update catalogue order status mutation
  const updateCatalogueStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/catalogue-orders/${id}/status`, { status });

      if (!response.ok) {
        throw new Error("Failed to update catalogue order status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Catalogue order status has been successfully updated",
      });
      refetchCatalogue();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      adminLogout();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/admin/login");
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/orders/export/csv");

      if (!response.ok) {
        throw new Error("Failed to export orders");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poster-orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Orders have been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle between standard and catalogue orders
  const toggleOrderType = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setSelectedOrder(null);
    setSelectedCatalogueOrder(null);
    setViewCatalogueOrders(!viewCatalogueOrders);
  };

  // View details of a standard order
  const handleViewOrder = async (orderId: number) => {
    try {
      const response = await apiRequest("GET", `/api/admin/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setSelectedOrder(data.order);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  // View details of a catalogue order
  const handleViewCatalogueOrder = async (orderId: number) => {
    try {
      const response = await apiRequest("GET", `/api/admin/catalogue-orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch catalogue order details");
      }

      const data = await response.json();

      // Make sure all image URLs are properly formatted for display
      const updatedItems = data.items.map((item: any) => {
        // If the posterImageUrl is relative (doesn't start with http), make it absolute
        // This ensures that image URLs from object storage are fully-qualified
        if (item.posterImageUrl && !item.posterImageUrl.startsWith('http')) {
          const baseUrl = window.location.origin;
          item.posterImageUrl = `${baseUrl}${item.posterImageUrl}`;
        }
        return item;
      });

      setSelectedCatalogueOrder({
        order: data.order,
        items: updatedItems
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load catalogue order details",
        variant: "destructive",
      });
    }
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearchTerm =
      searchTerm === "" ||
      order.confirmationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatusFilter = statusFilter === null || order.status === statusFilter;

    return matchesSearchTerm && matchesStatusFilter;
  });

  // Filter catalogue orders based on search term and status
  const filteredCatalogueOrders = catalogueOrders.filter((order) => {
    const matchesSearchTerm =
      searchTerm === "" ||
      order.confirmationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatusFilter = statusFilter === null || order.status === statusFilter;

    return matchesSearchTerm && matchesStatusFilter;
  });

  // Status color mapping helper
  const getStatusColor = (status: string = "pending") => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "processing":
        return "bg-blue-500/20 text-blue-500";
      case "shipped":
        return "bg-green-500/20 text-green-500";
      case "delivered":
        return "bg-green-700/20 text-green-700";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  // Check if the user is authenticated
  useEffect(() => {
    if (!isAdmin)
      setLocation("/admin/login");
  }, []);

  // Loading state
  if (isStandardLoading && !viewCatalogueOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#f1b917]" />
      </div>
    );
  }

  // Loading catalogue orders
  if (isCatalogueLoading && viewCatalogueOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#f1b917]" />
      </div>
    );
  }

  // Error handling for standard orders
  if (standardError && !viewCatalogueOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="w-full max-w-md border border-red-500 bg-black text-white">
          <CardHeader>
            <CardTitle className="text-xl text-red-500">Error Loading Orders</CardTitle>
            <CardDescription className="text-gray-400">
              {standardError instanceof Error ? standardError.message : "An unknown error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchStandard()} className="w-full bg-[#f1b917] hover:bg-opacity-90 text-white">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error handling for catalogue orders
  if (catalogueError && viewCatalogueOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="w-full max-w-md border border-red-500 bg-black text-white">
          <CardHeader>
            <CardTitle className="text-xl text-red-500">Error Loading Catalogue Orders</CardTitle>
            <CardDescription className="text-gray-400">
              {catalogueError instanceof Error ? catalogueError.message : "An unknown error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchCatalogue()} className="w-full bg-[#f1b917] hover:bg-opacity-90 text-white">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={handleExportCSV}
              className="bg-[#f1b917] hover:bg-opacity-90 text-white"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={() => { }}
              disabled={isDownloadingStorage}
              className="bg-[#f1b917] hover:bg-opacity-90 text-white"
            >
              {isDownloadingStorage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Download Object Storage
                </>
              )}
            </Button>
            <Button
              onClick={() => viewCatalogueOrders ? refetchCatalogue() : refetchStandard()}
              variant="outline"
              className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Link href="/admin/catalogue">
              <Button
                variant="outline"
                className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
              >
                View Full Images
              </Button>
            </Link>
            <Link href="/admin/review">
              <Button
                variant="outline"
                className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
              >
                Review Queue
              </Button>
            </Link>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="w-full flex justify-center mb-8">
          <Button
            onClick={toggleOrderType}
            variant="outline"
            className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
          >
            {viewCatalogueOrders ? "View Standard Orders" : "View Catalogue Orders"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">
          {viewCatalogueOrders ? "Catalogue Orders" : "Standard Orders"}
        </h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by confirmation ID, email or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 w-full text-white"
            />
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all" className="text-white">All Statuses</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="processing" className="text-white">Processing</SelectItem>
              <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
              <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
              <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display standard orders */}
        {!viewCatalogueOrders && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Confirmation ID</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={7} className="text-center py-4 text-gray-400">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-gray-700">
                          <TableCell className="font-medium text-white">
                            {order.confirmationId || "N/A"}
                          </TableCell>
                          <TableCell className="text-white">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {order.firstName} {order.lastName}
                          </TableCell>
                          <TableCell className="text-white">{order.email}</TableCell>
                          <TableCell className="text-white">
                            CHF {order.amount?.toFixed(2) || "29.95"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(order.status || "pending")}`}>
                              {order.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex flex-col sm:flex-row gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
                                  onClick={() => handleViewOrder(order.id)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Confirmation ID: {selectedOrder?.confirmationId || "N/A"}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-4">
                                    {/* Poster Image Preview - RESTORED */}
                                    <div className="flex justify-center bg-gray-900 p-4 rounded-md">
                                      <div className="flex flex-col items-center">
                                        <h3 className="font-semibold mb-4 text-[#f1b917]">Poster Image</h3>
                                        <div className="bg-white p-4 shadow-lg rounded-sm overflow-hidden" style={{ aspectRatio: "1/1.414" }}>
                                          {selectedOrder.posterImageUrl || selectedOrder.originalImageUrl ? (
                                            <img
                                              src={selectedOrder.posterImageUrl ?? selectedOrder.originalImageUrl ?? undefined}
                                              alt="Poster"
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                                              No image available
                                            </div>
                                          )}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-400">
                                          {selectedOrder.style || "Standard Style"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-gray-800 p-3 rounded-md">
                                        <h3 className="font-semibold mb-2 text-[#f1b917] border-b border-gray-700 pb-2">
                                          Customer Information
                                        </h3>
                                        <div className="space-y-2 text-sm sm:text-base">
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Name:</span>
                                            <span className="text-white">{selectedOrder.firstName} {selectedOrder.lastName}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Email:</span>
                                            <span className="text-white overflow-hidden text-ellipsis">{selectedOrder.email}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Address:</span>
                                            <span className="text-white">{selectedOrder.address || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">City:</span>
                                            <span className="text-white">{selectedOrder.city || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Postal Code:</span>
                                            <span className="text-white">{selectedOrder.zipCode || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Country:</span>
                                            <span className="text-white">{selectedOrder.country || "N/A"}</span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="bg-gray-800 p-3 rounded-md">
                                        <h3 className="font-semibold mb-2 text-[#f1b917] border-b border-gray-700 pb-2">
                                          Order Information
                                        </h3>
                                        <div className="space-y-2 text-sm sm:text-base">
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Order Date:</span>
                                            <span className="text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Amount:</span>
                                            <span className="text-white">CHF {selectedOrder.amount?.toFixed(2) || "29.95"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <span className="text-white">
                                              <Badge className={`${getStatusColor(selectedOrder.status || "pending")}`}>
                                                {selectedOrder.status || "pending"}
                                              </Badge>
                                            </span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Style:</span>
                                            <span className="text-white">{selectedOrder.style || "N/A"}</span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-6">
                                  <Select
                                    defaultValue={(selectedOrder?.status ?? "pending") as string}
                                    onValueChange={(value) => {
                                      if (selectedOrder) {
                                        updateStatusMutation.mutate({ id: selectedOrder.id, status: value });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                                      <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                      <SelectItem value="processing" className="text-white">Processing</SelectItem>
                                      <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                                      <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                                      <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Select
                              value={(order.status ?? "pending") as string}
                              onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                            >
                              <SelectTrigger className="h-8 w-full sm:w-[130px] bg-gray-900 border-gray-700 text-white">
                                <SelectValue placeholder="Status" className="text-xs" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                <SelectItem value="processing" className="text-white">Processing</SelectItem>
                                <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                                <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                                <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Display catalogue orders */}
        {viewCatalogueOrders && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Confirmation ID</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Items</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCatalogueOrders.length === 0 ? (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={8} className="text-center py-4 text-gray-400">
                          No catalogue orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCatalogueOrders.map((order) => (
                        <TableRow key={order.id} className="border-gray-700">
                          <TableCell className="font-medium text-white">
                            {order.confirmationId || "N/A"}
                          </TableCell>
                          <TableCell className="text-white">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {order.firstName} {order.lastName}
                          </TableCell>
                          <TableCell className="text-white">{order.email}</TableCell>
                          <TableCell className="text-white">
                            –
                          </TableCell>
                          <TableCell className="text-white">
                            CHF {order.amount?.toFixed(2) || "29.95"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(order.status || "pending")}`}>
                              {order.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex flex-col sm:flex-row gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:bg-opacity-20"
                                  onClick={() => handleViewCatalogueOrder(order.id)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Catalogue Order Details</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Confirmation ID: {selectedCatalogueOrder?.order?.confirmationId || "N/A"}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedCatalogueOrder && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-gray-800 p-3 rounded-md">
                                        <h3 className="font-semibold mb-2 text-[#f1b917] border-b border-gray-700 pb-2">
                                          Customer Information
                                        </h3>
                                        <div className="space-y-2 text-sm sm:text-base">
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Name:</span>
                                            <span className="text-white">{selectedCatalogueOrder.order.firstName} {selectedCatalogueOrder.order.lastName}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Email:</span>
                                            <span className="text-white overflow-hidden text-ellipsis">{selectedCatalogueOrder.order.email}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Address:</span>
                                            <span className="text-white">{selectedCatalogueOrder.order.address || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">City:</span>
                                            <span className="text-white">{selectedCatalogueOrder.order.city || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Postal Code:</span>
                                            <span className="text-white">{selectedCatalogueOrder.order.zipCode || "N/A"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Country:</span>
                                            <span className="text-white">{selectedCatalogueOrder.order.country || "N/A"}</span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="bg-gray-800 p-3 rounded-md">
                                        <h3 className="font-semibold mb-2 text-[#f1b917] border-b border-gray-700 pb-2">
                                          Order Information
                                        </h3>
                                        <div className="space-y-2 text-sm sm:text-base">
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Order Date:</span>
                                            <span className="text-white">{new Date(selectedCatalogueOrder.order.createdAt).toLocaleString()}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Total Amount:</span>
                                            <span className="text-white">CHF {selectedCatalogueOrder.order.amount?.toFixed(2) || "29.95"}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <span className="text-white">
                                              <Badge className={`${getStatusColor(selectedCatalogueOrder.order.status || "pending")}`}>
                                                {selectedCatalogueOrder.order.status || "pending"}
                                              </Badge>
                                            </span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span className="text-gray-400">Items:</span>
                                            <span className="text-white">{selectedCatalogueOrder.items.length}</span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-6 bg-gray-800 p-4 rounded-md">
                                      <h3 className="font-semibold mb-3 text-[#f1b917] border-b border-gray-700 pb-2">
                                        Order Items
                                      </h3>
                                      <div className="space-y-4">
                                        {selectedCatalogueOrder.items.map((item, index) => (
                                          <div key={index} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                              <div className="col-span-2">
                                                <p className="font-medium text-[#f1b917]">
                                                  {item.style || 'Standard Style'}
                                                </p>
                                                <p className="text-sm text-gray-400">ID: {item.id}</p>
                                                <p className="text-sm text-white">Quantity: {item.quantity || 1}</p>
                                                <p className="text-sm text-white">Price: CHF {item.price?.toFixed(2) || "29.95"}</p>
                                              </div>
                                              <div className="col-span-1">
                                                {item.posterImageUrl ? (
                                                  <img
                                                    src={item.posterImageUrl}
                                                    alt={item.style || "Catalogue item"}
                                                    className="max-h-20 w-auto object-contain bg-black p-1 rounded"
                                                  />
                                                ) : (
                                                  <div className="h-20 flex items-center justify-center bg-black border border-gray-700 rounded">
                                                    <p className="text-gray-500 text-xs">No image</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-6">
                                  <Select
                                    defaultValue={(selectedCatalogueOrder?.order?.status ?? "pending") as string}
                                    onValueChange={(value) => {
                                      if (selectedCatalogueOrder) {
                                        updateCatalogueStatusMutation.mutate({
                                          id: selectedCatalogueOrder.order.id,
                                          status: value
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                                      <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                      <SelectItem value="processing" className="text-white">Processing</SelectItem>
                                      <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                                      <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                                      <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Select
                              value={(order.status ?? "pending") as string}
                              onValueChange={(value) => updateCatalogueStatusMutation.mutate({ id: order.id, status: value })}
                            >
                              <SelectTrigger className="h-8 w-full sm:w-[130px] bg-gray-900 border-gray-700 text-white">
                                <SelectValue placeholder="Status" className="text-xs" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                <SelectItem value="processing" className="text-white">Processing</SelectItem>
                                <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                                <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                                <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}