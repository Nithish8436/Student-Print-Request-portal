
// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { usePrint } from '../../contexts/PrintContext';
// import { toast } from "sonner";
// import { CreditCard, QrCode } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';

// const Payment = () => {
//   const { orderId } = useParams();
//   const { completePayment } = usePrint();
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [paymentMethod, setPaymentMethod] = useState('gpay');
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchOrder = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('id', orderId)
//           .single();
          
//         if (error) throw error;
        
//         if (data) {
//           setOrder(data);
//         } else {
//           toast.error("Order not found");
//           navigate('/student/upload');
//         }
//       } catch (error) {
//         console.error("Error fetching order:", error);
//         toast.error("Error loading order details");
//         navigate('/student/upload');
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchOrder();
//   }, [orderId, navigate]);

//   const calculatePrice = () => {
//     if (!order) return 0;
    
//     let basePrice = 1; // Base price per page
    
//     if (order.is_color_print) basePrice += 4; // Extra for color
//     if (order.paper_size === 'Glossy Print') basePrice += 3; // Extra for glossy
//     if (order.paper_size === 'Matte Print') basePrice += 2; // Extra for matte
    
//     return basePrice * order.copies; // Multiply by number of copies
//   };

//   const handlePayment = async () => {
//     const success = await completePayment(orderId);
    
//     if (success) {
//       toast.success(`Payment successful! Your order is being processed.`);
//       navigate('/student/track');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="text-center py-10">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
//         <p className="mt-2 text-gray-500">Loading order details...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
//         <div className="md:col-span-3">
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            
//             <div className="border-b pb-4 mb-4">
//               <p className="text-sm text-gray-500 mb-1">Order ID: {order.id.substring(0, 8)}</p>
//               <p className="font-medium">{order.file_name}</p>
//             </div>
            
//             <div className="space-y-3 mb-6">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Print Type:</span>
//                 <span>{order.paper_size}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Copies:</span>
//                 <span>{order.copies}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Color Print:</span>
//                 <span>{order.is_color_print ? 'Yes' : 'No'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Double Sided:</span>
//                 <span>{order.is_double_sided ? 'Yes' : 'No'}</span>
//               </div>
//             </div>
            
//             <div className="border-t pt-4">
//               <div className="flex justify-between items-center">
//                 <span className="font-medium">Total</span>
//                 <span className="text-lg font-bold">₹{calculatePrice()}</span>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className="md:col-span-2">
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-medium mb-4">Payment Method</h3>
            
//             <div className="space-y-3 mb-6">
//               <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="paymentMethod"
//                   value="gpay"
//                   checked={paymentMethod === 'gpay'}
//                   onChange={() => setPaymentMethod('gpay')}
//                   className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
//                 />
//                 <span className="ml-2 flex items-center">
//                   <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
//                   UPI / GPay
//                 </span>
//               </label>
              
//               <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="paymentMethod"
//                   value="qrcode"
//                   checked={paymentMethod === 'qrcode'}
//                   onChange={() => setPaymentMethod('qrcode')}
//                   className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
//                 />
//                 <span className="ml-2 flex items-center">
//                   <QrCode className="h-5 w-5 text-purple-500 mr-2" />
//                   Scan QR Code
//                 </span>
//               </label>
//             </div>
            
//             {paymentMethod === 'gpay' && (
//               <div className="border rounded-lg p-4 mb-6 bg-blue-50">
//                 <p className="text-center mb-2 text-sm">Pay using UPI ID</p>
//                 <p className="text-center font-medium text-blue-700">printhub@ybl</p>
//               </div>
//             )}
            
//             {paymentMethod === 'qrcode' && (
//               <div className="border rounded-lg p-4 mb-6 text-center">
//                 <div className="bg-white p-2 inline-block mb-2">
//                   <div className="w-32 h-32 bg-gray-300 mx-auto grid place-items-center">
//                     <QrCode className="h-16 w-16 text-gray-600" />
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-600">Scan with any UPI app</p>
//               </div>
//             )}
            
//             <button
//               onClick={handlePayment}
//               className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150"
//             >
//               Pay ₹{calculatePrice()}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Payment;




import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrint } from '../../contexts/PrintContext';
import { toast } from 'sonner';
import { CreditCard, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Payment = () => {
  const { orderId } = useParams();
  const { completePayment } = usePrint();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error || !data) {
          console.error('Error fetching order:', error);
          toast.error('Order not found');
          navigate('/student/upload');
          return;
        }

        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Error loading order details');
        navigate('/student/upload');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      toast.error('Invalid order ID');
      navigate('/student/upload');
    }
  }, [orderId, navigate]);

  const calculatePrice = () => {
    if (!order) return 0;

    let basePrice = 1; // Base price per page
    if (order.is_color_print) basePrice += 4; // Extra for color
    if (order.paper_size === 'Glossy Print') basePrice += 3; // Extra for glossy
    if (order.paper_size === 'Matte Print') basePrice += 2; // Extra for matte

    return basePrice * order.copies; // Multiply by number of copies
  };

  const handlePayment = async () => {
    try {
      const success = await completePayment(orderId);

      if (success) {
        toast.success('Payment successful! Your order is being processed.');
        navigate(`/student/track?orderId=${orderId}`); // Pass orderId to Track
      } else {
        toast.error('Payment failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error in handlePayment:', error);
      toast.error('Error processing payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Order not found. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>

            <div className="border-b pb-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">
                Order ID: {order.id.substring(0, 8)}
              </p>
              <p className="font-medium">{order.file_name}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Print Type:</span>
                <span>{order.paper_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Copies:</span>
                <span>{order.copies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color Print:</span>
                <span>{order.is_color_print ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Double Sided:</span>
                <span>{order.is_double_sided ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">₹{calculatePrice()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-4">Payment Method</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="gpay"
                  checked={paymentMethod === 'gpay'}
                  onChange={() => setPaymentMethod('gpay')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-2 flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                  UPI / GPay
                </span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qrcode"
                  checked={paymentMethod === 'qrcode'}
                  onChange={() => setPaymentMethod('qrcode')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-2 flex items-center">
                  <QrCode className="h-5 w-5 text-purple-500 mr-2" />
                  Scan QR Code
                </span>
              </label>
            </div>

            {paymentMethod === 'gpay' && (
              <div className="border rounded-lg p-4 mb-6 bg-blue-50">
                <p className="text-center mb-2 text-sm">Pay using UPI ID</p>
                <p className="text-center font-medium text-blue-700">
                  printhub@ybl
                </p>
              </div>
            )}

            {paymentMethod === 'qrcode' && (
              <div className="border rounded-lg p-4 mb-6 text-center">
                <div className="bg-white p-2 inline-block mb-2">
                  <div className="w-32 h-32 bg-gray-300 mx-auto grid place-items-center">
                    <QrCode className="h-16 w-16 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Scan with any UPI app</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150"
            >
              Pay ₹{calculatePrice()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;