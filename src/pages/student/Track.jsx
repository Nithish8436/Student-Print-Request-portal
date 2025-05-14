import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Clock, Check, Printer, AlertCircle, MessageSquare } from 'lucide-react';

const Track = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Ready to Print':
        return <Printer className="h-5 w-5 text-blue-500" />;
      case 'Printing':
        return <Printer className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'Completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'Delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ready to Print':
        return 'bg-blue-100 text-blue-800';
      case 'Printing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    console.log('Current user:', currentUser); // Debug log

    if (!currentUser) {
      console.log('No current user found'); // Debug log
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        console.log('Fetching orders for user:', currentUser.id); // Debug log
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('payment_status', 'paid')
          .not('status', 'eq', 'Completed')
          .not('status', 'eq', 'Delivered')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error); // Debug log
          throw error;
        }

        console.log('Fetched orders:', data); // Debug log
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.message);
        toast.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload); // Debug log
          
          if (
            payload.eventType === 'INSERT' &&
            payload.new.payment_status === 'paid' &&
            !['Completed', 'Delivered'].includes(payload.new.status)
          ) {
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            if (['Completed', 'Delivered'].includes(payload.new.status)) {
              setOrders((prev) =>
                prev.filter((order) => order.id !== payload.new.id)
              );
            } else if (payload.new.payment_status === 'paid') {
              setOrders((prev) =>
                prev.map((order) =>
                  order.id === payload.new.id ? payload.new : order
                )
              );
              // Add new order if not already in list
              if (!orders.some((order) => order.id === payload.new.id)) {
                setOrders((prev) => [payload.new, ...prev]);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) =>
              prev.filter((order) => order.id !== payload.old.id)
            );
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

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  // Debug render
  console.log('Render state:', { loading, error, ordersCount: orders.length });

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Orders</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Track Orders</h2>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No active orders</h3>
          <p className="text-gray-500 mt-2">You don't have any orders being processed at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Order #{order.id.substring(0,8)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
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
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {file.name}
                          </a>
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
                  <Printer className="h-4 w-4 mr-2" />
                  <span>
                    {order.paper_size} • {order.copies} {order.copies > 1 ? 'copies' : 'copy'} • 
                    {order.is_color_print ? ' Color' : ' B&W'} • 
                    {order.is_double_sided ? ' Double-sided' : ' Single-sided'}
                  </span>
                </div>
                {order.notes && (
                  <div className="flex items-start text-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{order.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2 text-sm font-medium">{order.status}</span>
                  </div>
                  {order.otp && (
                    <div className="text-sm">
                      <span className="text-gray-500">OTP: </span>
                      <span className="font-bold">{order.otp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Track;