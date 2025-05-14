import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePrint } from '../contexts/PrintContext';
import { Printer, ClipboardList, CheckSquare, Power, LogOut } from 'lucide-react';

const XeroxSidebar = () => {
  const { currentUser, logout } = useAuth();
  const { serverActive, toggleServer } = usePrint();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleServer = async () => {
    setIsToggling(true);
    try {
      await toggleServer();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b">
        <NavLink to="/" className="font-bold text-xl text-primary flex items-center">
          <Printer className="mr-2 h-6 w-6" />
          PrintHub
        </NavLink>
      </div>
      
      <div className="p-4 border-b">
        <div className="text-sm text-gray-500 mb-2">Welcome,</div>
        <div className="font-medium">{currentUser?.name}</div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="mb-4 text-xs font-semibold text-gray-500 uppercase">Main Menu</div>
        <ul className="space-y-1">
          <li>
            <NavLink 
              to="/xerox/orders" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Orders
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/xerox/history" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              Order History
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/xerox/completed" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <CheckSquare className="mr-2 h-5 w-5" />
              Completed Orders
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/xerox/inventory" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <span className="mr-2 h-5 w-5" role="img" aria-label="inventory">📦</span>
              Inventory
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/xerox/revenue" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <span className="mr-2 h-5 w-5" role="img" aria-label="revenue">💰</span>
              Revenue
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t space-y-3">
        <button
          onClick={handleToggleServer}
          disabled={isToggling}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
            isToggling 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : serverActive 
                ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                : 'bg-green-100 hover:bg-green-200 text-green-700'
          }`}
        >
          <Power className="h-5 w-5 mr-1" />
          {isToggling 
            ? 'Updating...' 
            : serverActive 
              ? 'Deactivate Server' 
              : 'Activate Server'
          }
        </button>
        
        <button 
          onClick={logout}
          className="w-full p-3 text-center text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default XeroxSidebar;
