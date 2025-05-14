
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';

const Profile = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-100 rounded-full p-6 mb-4">
            <User className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-xl font-medium">{currentUser.name}</h3>
          <p className="text-gray-500">{currentUser.email}</p>
        </div>
        
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
              <p>{currentUser.name}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Roll Number</h4>
              <p>{currentUser.rollNumber || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
              <p>{currentUser.email}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Account Type</h4>
              <p className="capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
