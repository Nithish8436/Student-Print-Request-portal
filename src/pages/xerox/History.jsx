import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle, Clock, Truck, Search } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../components/ui/tabs";

const History = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdersAndProfiles = async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersError) {
        setOrders([]);
        setLoading(false);
        return;
      }
      // Get unique user_ids
      const userIds = [...new Set((ordersData || []).map(order => order.user_id))];
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      // Map user_id to name
      const idToName = {};
      (profilesData || []).forEach(profile => { idToName[profile.id] = profile.name; });
      // Attach student_name to each order
      const ordersWithNames = (ordersData || []).map(order => ({
        ...order,
        student_name: idToName[order.user_id] || order.user_id
      }));
      setOrders(ordersWithNames);
      setLoading(false);
    };
    fetchOrdersAndProfiles();
    // Real-time subscription (unchanged)
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // For simplicity, refetch all orders and profiles on any change
        fetchOrdersAndProfiles();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  // Map status values to tabs
  const statusMap = {
    processing: [
      'Pending',
      'Printing',
      'Paid - Waiting for Processing'
    ],
    ready: [
      'Ready to Print'
    ],
    completed: [
      'Completed'
    ],
    delivered: [
      'Delivered'
    ]
  };

  // Filter orders based on status and search term
  const filterOrders = (status, searchTerm) => {
    return orders
      .filter(order => {
        const matchesStatus =
          status === 'all' ||
          (status !== 'all' && statusMap[status]?.includes(order.status));
        const matchesSearch =
          !searchTerm ||
          (order.file_name && order.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.student_name && order.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.id && order.id.toString().includes(searchTerm));
        return order.payment_status === 'paid' && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getStatusIcon = (status) => {
    if (status === 'Ready for Pickup') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'Processing') return <Clock className="h-5 w-5 text-blue-500" />;
    if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-purple-500" />;
    if (status === 'Delivered') return <Truck className="h-5 w-5 text-indigo-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  const OrderList = ({ orders }) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-10">
          <Calendar className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No orders found</h3>
          <p className="text-gray-500">No orders match your current filter criteria.</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4 text-left">Order #</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">File</th>
              <th className="py-3 px-4 text-left">Student</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{order.id ? order.id.substring(0, 8) : ''}</td>
                <td className="py-3 px-4">{order.created_at ? formatDate(order.created_at) : ''}</td>
                <td className="py-3 px-4">
                  {Array.isArray(order.files) && order.files.length > 0 ? (
                    <span>
                      {order.files.map((file, idx) => (
                        <span key={idx}>
                          {file.name}{idx < order.files.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  ) : (
                    order.file_name || ''
                  )}
                </td>
                <td className="py-3 px-4">{order.student_name || ''}</td>
                <td className="py-3 px-4">
                  {order.paper_size || ''}
                  {order.is_color_print !== undefined ? (order.is_color_print ? ' / Color' : ' / B&W') : ''}
                  {order.is_double_sided !== undefined ? (order.is_double_sided ? ' / Double-sided' : ' / Single-sided') : ''}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{order.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Order History</h2>
      </div>
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by order number, filename or student..."
          className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Tabs defaultValue="all">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="pt-4">
            <OrderList orders={filterOrders('all', searchTerm)} />
          </TabsContent>
          <TabsContent value="processing" className="pt-4">
            <OrderList orders={filterOrders('processing', searchTerm)} />
          </TabsContent>
          <TabsContent value="ready" className="pt-4">
            <OrderList orders={filterOrders('ready', searchTerm)} />
          </TabsContent>
          <TabsContent value="completed" className="pt-4">
            <OrderList orders={filterOrders('completed', searchTerm)} />
          </TabsContent>
          <TabsContent value="delivered" className="pt-4">
            <OrderList orders={filterOrders('delivered', searchTerm)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
