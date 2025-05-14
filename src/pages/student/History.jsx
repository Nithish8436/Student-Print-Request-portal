
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import OrderCard from '../../components/OrderCard';

const History = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error("Failed to fetch order history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up realtime subscription for order updates
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${currentUser.id}`
        }, 
        (payload) => {
          console.log("Realtime order update received:", payload);
          
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id ? payload.new : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => 
              prev.filter(order => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No orders yet</h3>
          <p className="text-gray-500 mt-2">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">Showing {orders.length} orders. Updates will appear in real-time.</p>
          {orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              showProgress={order.payment_status === 'paid' && !['Completed', 'Delivered'].includes(order.status)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
