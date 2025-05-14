import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, FilePlus } from 'lucide-react';

const Completed = () => {
  const [orders, setOrders] = useState([]);
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

    // Real-time subscription
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Subscription event (Completed):', payload);
        setOrders(prev => {
          if (payload.eventType === 'INSERT') {
            return [payload.new, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            return prev.map(order => order.id === payload.new.id ? { ...order, ...payload.new } : order);
          } else if (payload.eventType === 'DELETE') {
            return prev.filter(order => order.id !== payload.old.id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  // Only completed and delivered (add more statuses if needed)
  const completedOrders = orders
    .filter(order => ['Completed', 'Delivered'].includes(order.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Get today's completed orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = completedOrders.filter(order => 
    new Date(order.created_at) >= today
  );

  // Calculate statistics
  const totalCompletedToday = todayOrders.filter(order => order.status === 'Completed').length;
  const totalDeliveredToday = todayOrders.filter(order => order.status === 'Delivered').length;
  const totalPagesToday = todayOrders.reduce((total, order) => total + order.copies, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Completed Orders</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium text-gray-600">Completed Today</h3>
          </div>
          <p className="text-3xl font-bold">{totalCompletedToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="font-medium text-gray-600">Delivered Today</h3>
          </div>
          <p className="text-3xl font-bold">{totalDeliveredToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <FilePlus className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-medium text-gray-600">Pages Printed</h3>
          </div>
          <p className="text-3xl font-bold">{totalPagesToday}</p>
        </div>
      </div>
      {completedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mt-4">No completed orders</h3>
          <p className="text-gray-500 mt-2">There are no completed orders to display.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-medium">Order #</th>
                <th className="py-3 px-4 text-left font-medium">Date Completed</th>
                <th className="py-3 px-4 text-left font-medium">File</th>
                <th className="py-3 px-4 text-left font-medium">Student</th>
                <th className="py-3 px-4 text-left font-medium">Copies</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{order.id ? order.id.substring(0, 8) : ''}</td>
                  <td className="py-3 px-4">{order.created_at ? new Date(order.created_at).toLocaleString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  }) : ''}</td>
                  <td className="py-3 px-4 max-w-xs truncate">
                    {Array.isArray(order.files) && order.files.length > 0
                      ? order.files.map((file, idx) => (
                          <span key={idx}>
                            {file.name}{idx < order.files.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      : order.file_name || ''}
                  </td>
                  <td className="py-3 px-4">{order.student_name || ''}</td>
                  <td className="py-3 px-4">{order.copies}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Completed;
