import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Printer, ChevronDown, Calendar, Clock, Check, X, FileText, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverActive, setServerActive] = useState(true);
  
  // Fetch orders and server status from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // First fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_status', 'paid')
          .not('status', 'eq', 'Completed')
          .not('status', 'eq', 'Delivered')
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          return;
        }

        // Then fetch profiles for all user_ids
        const userIds = ordersData.map(order => order.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Combine orders with their profiles
        const ordersWithProfiles = ordersData.map(order => ({
          ...order,
          profiles: profilesData.find(profile => profile.id === order.user_id)
        }));
        
        console.log('Fetched orders with profiles:', ordersWithProfiles);
        setOrders(ordersWithProfiles);
      } catch (error) {
        console.error('Error in orders fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchServerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('server_status')
          .select('is_active')
          .eq('id', 1)
          .single();
          
        if (error) {
          console.error("Error fetching server status:", error);
          return;
        }
        
        setServerActive(data.is_active);
      } catch (error) {
        console.error("Error in server status fetch:", error);
      }
    };
    
    fetchOrders();
    fetchServerStatus();
    
    // Set up realtime subscription for orders
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        }, 
        async (payload) => {
          console.log('Real-time update received:', payload); // Debug log
          
          if (payload.eventType === 'INSERT') {
            // For new orders, fetch the related profile data
            if (payload.new.payment_status === 'paid' && 
                !['Completed', 'Delivered'].includes(payload.new.status)) {
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', payload.new.user_id)
                  .single();
                  
                if (!error && profile) {
                  console.log('Adding new order with profile:', { ...payload.new, profiles: profile }); // Debug log
                  setOrders(prev => [{...payload.new, profiles: profile}, ...prev]);
                  toast.success('New order received!');
                } else {
                  console.log('Adding new order without profile:', payload.new); // Debug log
                  setOrders(prev => [payload.new, ...prev]);
                  toast.success('New order received!');
                }
              } catch (error) {
                console.error('Error fetching profile for new order:', error);
                setOrders(prev => [payload.new, ...prev]);
                toast.success('New order received!');
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (['Completed', 'Delivered'].includes(payload.new.status)) {
              setOrders(prev => prev.filter(order => order.id !== payload.new.id));
              toast.info(`Order ${payload.new.id.substring(0,8)} has been ${payload.new.status.toLowerCase()}`);
            } else {
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? {...order, ...payload.new} : order
                )
              );
              toast.info(`Order ${payload.new.id.substring(0,8)} status updated to ${payload.new.status}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
            toast.info(`Order ${payload.old.id.substring(0,8)} has been removed`);
          }
        }
      )
      .subscribe((status, error) => {
        console.log('Subscription status:', status); // Debug log
        if (error) {
          console.error('Subscription error:', error);
          toast.error('Error setting up real-time updates');
        }
      });
      
    const serverStatusSubscription = supabase
      .channel('public:server_status')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'server_status'
        }, 
        (payload) => {
          setServerActive(payload.new.is_active);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(serverStatusSubscription);
    };
  }, []);
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Failed to update order status');
        return;
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update local state if needed
      if (['Completed', 'Delivered'].includes(newStatus)) {
        setSelectedOrder(null);
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handlePrint = async (order) => {
    try {
      // Get the document URL from the order
      const documentUrl = Array.isArray(order.files) && order.files.length > 0 
        ? order.files[0].url
        : order.file_url;

      if (!documentUrl) {
        toast.error("No document URL found for this order");
        return;
      }

      // Extract the file path (everything after 'documents/')
      const urlParts = documentUrl.split('/');
      const documentsIndex = urlParts.indexOf('documents');
      if (documentsIndex === -1) {
        toast.error("Invalid document URL format");
        return;
      }
      const filePath = urlParts.slice(documentsIndex + 1).join('/');

      // Generate a signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        toast.error("Failed to generate signed URL");
        return;
      }

      // Open a new tab and inject an iframe with auto-print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups for this site.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>
              body { margin: 0; }
              iframe { width: 100vw; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe id="pdfFrame" src="${signedUrlData.signedUrl}"></iframe>
            <script>
              const iframe = document.getElementById('pdfFrame');
              iframe.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      toast.success("Document opened and print dialog triggered.");
    } catch (error) {
      toast.error("Failed to open document for printing");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Print Orders</h2>
        <div className={`px-3 py-1 rounded-full text-sm ${serverActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Server Status: {serverActive ? 'Online' : 'Offline'}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No print orders yet</h3>
          <p className="text-gray-500 mt-2">There are no orders to process at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Order #{order.id.substring(0,8)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'Ready to Print' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'Printing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                {Array.isArray(order.files) && order.files.length > 0 ? (
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Files:</span>
                    </div>
                    <ul className="ml-6 list-disc">
                      {order.files.map((file, idx) => (
                        <li key={idx} className="truncate">
                          <span>{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="truncate">{order.file_name}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{order.profiles?.name || 'Unknown Student'}</span>
                </div>
                {order.otp && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold">OTP:</span> <span className="font-mono">{order.otp}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex items-start text-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">#{selectedOrder.id.substring(0,8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{selectedOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student</p>
                    <p className="font-medium">{selectedOrder.profiles?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Print Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">File(s)</p>
                      {Array.isArray(selectedOrder.files) && selectedOrder.files.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {selectedOrder.files.map((file, idx) => (
                            <li key={idx} className="truncate">
                              <span>{file.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-medium truncate">{selectedOrder.file_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">OTP</p>
                      <p className="font-mono font-semibold">{selectedOrder.otp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paper Size</p>
                      <p className="font-medium">{selectedOrder.paper_size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Copies</p>
                      <p className="font-medium">{selectedOrder.copies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Print Type</p>
                      <p className="font-medium">
                        {selectedOrder.is_color_print ? 'Color' : 'Black & White'}
                        {selectedOrder.is_double_sided ? ' (Double-sided)' : ' (Single-sided)'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Customer Message</h4>
                    <p className="text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handlePrint(selectedOrder)}
                      className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Document
                    </button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-full">
                        Update Status <ChevronDown className="h-4 w-4 ml-2" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateOrderStatus(selectedOrder.id, "Pending")}>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(selectedOrder.id, "Ready to Print")}>
                          Ready to Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(selectedOrder.id, "Printing")}>
                          Printing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(selectedOrder.id, "Completed")}>
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(selectedOrder.id, "Delivered")}>
                          Delivered
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
