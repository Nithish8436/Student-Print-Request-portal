
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import { usePrint } from '../../contexts/PrintContext';

const StudentLayout = () => {
  const { currentUser } = useAuth();
  const { serverActive } = usePrint();
  
  // Protect route - only for students
  if (!currentUser || currentUser.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {!serverActive && (
          <div className="bg-red-500 text-white text-center py-2">
            Server is currently offline. Document uploads are disabled.
          </div>
        )}
        
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Welcome, {currentUser.name}</h1>
          </header>
          
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
