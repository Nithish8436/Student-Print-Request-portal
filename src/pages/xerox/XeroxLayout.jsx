import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePrint } from '../../contexts/PrintContext';
import XeroxSidebar from '../../components/XeroxSidebar';

const XeroxLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Protect route - only for xerox staff
  if (!currentUser || currentUser.role !== 'xerox') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <XeroxSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default XeroxLayout;
