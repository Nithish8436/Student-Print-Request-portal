
// import React, { useEffect } from 'react';
// import { Navigate, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { toast } from 'sonner';
// import { supabase } from '@/integrations/supabase/client';

// const Index = () => {
//   const { currentUser } = useAuth();
//   const navigate = useNavigate();
  
//   useEffect(() => {
//     // Check server status on load
//     const checkServerStatus = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('server_status')
//           .select('is_active')
//           .eq('id', 1)
//           .single();
          
//         if (!error && data && !data.is_active) {
//           toast.info("The print server is currently offline. Some features may be limited.");
//         }
//       } catch (error) {
//         console.error("Error checking server status:", error);
//       }
//     };
    
//     if (currentUser) {
//       checkServerStatus();
//     }
//   }, [currentUser]);
  
//   if (currentUser) {
//     // Redirect based on user role
//     switch (currentUser.role) {
//       case 'student':
//         return <Navigate to="/student/upload" replace />;
//       case 'xerox':
//         return <Navigate to="/xerox/orders" replace />;
//       case 'admin':
//         return <Navigate to="/admin/staff" replace />;
//       default:
//         toast.error("Unknown user role. Please contact support.");
//         return <Navigate to="/login" replace />;
//     }
//   }
  
//   // Not logged in, redirect to login page
//   return <Navigate to="/login" replace />;
// };

// export default Index;




import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    // Check server status on load
    const checkServerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('server_status')
          .select('is_active')
          .eq('id', 1)
          .single();
          
        if (!error && data && !data.is_active) {
          toast.info("The print server is currently offline. Some features may be limited.");
        }
      } catch (error) {
        console.error("Error checking server status:", error);
      }
    };
    
    if (currentUser) {
      checkServerStatus();
    }
  }, [currentUser]);
  
  if (currentUser) {
    // Only allow student role
    if (currentUser.role === 'student') {
      return <Navigate to="/student/upload" replace />;
    } else {
      toast.error("Only student accounts are allowed to log in");
      return <Navigate to="/login" replace />;
    }
  }
  
  // Not logged in, redirect to login page
  return <Navigate to="/login" replace />;
};

export default Index;