import React, { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePrint } from '../../contexts/PrintContext';
import { Users, BarChart3, Package, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const { inventory } = usePrint();
  const [activeTab, setActiveTab] = useState('staff');
  
  // Protect route - only for admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // Low inventory detection
  let lowItems = [];
  if (inventory && inventory.length > 0) {
    const inv = inventory[0];
    if (inv.paper_a4 !== undefined && inv.paper_a4 < 200) lowItems.push('A4 Paper');
    if (inv.paper_a3 !== undefined && inv.paper_a3 < 100) lowItems.push('A3 Paper');
    if (inv.ink_black !== undefined && inv.ink_black < 20) lowItems.push('Black Ink');
    if (inv.ink_color !== undefined && inv.ink_color < 20) lowItems.push('Color Ink');
    if (inv.staples !== undefined && inv.staples < 2) lowItems.push('Staples');
    if (inv.paper_clips !== undefined && inv.paper_clips < 2) lowItems.push('Paper Clips');
    if (inv.binding_materials !== undefined && inv.binding_materials < 2) lowItems.push('Binding Materials');
    if (inv.maintenance_kits !== undefined && inv.maintenance_kits < 1) lowItems.push('Maintenance Kits');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage staff, revenue, and inventory</p>
            </div>
            
            <button 
              onClick={logout}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <LogOut className="h-5 w-5 mr-1" />
              Logout
            </button>
          </div>
          {/* Low Inventory Notification */}
          {lowItems.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center gap-2">
              <span className="font-semibold">Alert:</span>
              <span>Inventory running low for: {lowItems.join(', ')}</span>
            </div>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b flex">
            <NavLink 
              to="/admin/staff" 
              className={({ isActive }) => 
                `flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Users className="h-5 w-5 mr-2" />
              Staff Management
            </NavLink>
            
            <NavLink 
              to="/admin/revenue" 
              className={({ isActive }) => 
                `flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Revenue Analytics
            </NavLink>
            
            <NavLink 
              to="/admin/inventory" 
              className={({ isActive }) => 
                `flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Package className="h-5 w-5 mr-2" />
              Inventory Management
            </NavLink>
          </div>
          
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
