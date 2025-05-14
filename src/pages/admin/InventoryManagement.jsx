import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash, X } from 'lucide-react';
import { toast } from "sonner";

const InventoryManagement = () => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    paper_a4: 0,
    paper_a3: 0,
    ink_black: 0,
    ink_color: 0,
    staples: 0,
    paper_clips: 0,
    binding_materials: 0,
    maintenance_kits: 0
  });

  useEffect(() => {
    // Fetch initial inventory
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to fetch inventory');
        return;
      }
      
      setInventory(data);
      setFormData({
        paper_a4: data.paper_a4 || 0,
        paper_a3: data.paper_a3 || 0,
        ink_black: data.ink_black || 0,
        ink_color: data.ink_color || 0,
        staples: data.staples || 0,
        paper_clips: data.paper_clips || 0,
        binding_materials: data.binding_materials || 0,
        maintenance_kits: data.maintenance_kits || 0
      });
    };
    fetchInventory();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.new) {
          setInventory(payload.new);
          setFormData({
            paper_a4: payload.new.paper_a4 || 0,
            paper_a3: payload.new.paper_a3 || 0,
            ink_black: payload.new.ink_black || 0,
            ink_color: payload.new.ink_color || 0,
            staples: payload.new.staples || 0,
            paper_clips: payload.new.paper_clips || 0,
            binding_materials: payload.new.binding_materials || 0,
            maintenance_kits: payload.new.maintenance_kits || 0
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          paper_a4: formData.paper_a4,
          paper_a3: formData.paper_a3,
          ink_black: formData.ink_black,
          ink_color: formData.ink_color,
          staples: formData.staples,
          paper_clips: formData.paper_clips,
          binding_materials: formData.binding_materials,
          maintenance_kits: formData.maintenance_kits
        })
        .eq('id', 1);
        
      if (error) throw error;
      
      toast.success("Inventory updated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving inventory:", error);
      toast.error(error.message || "Failed to save inventory");
    }
  };

  if (!inventory) return <div>Loading inventory...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Inventory Management</h2>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Edit className="h-5 w-5 mr-1" />
          Update Inventory
        </button>
      </div>
      
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Current Inventory Status</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div><strong>A4 Paper:</strong> {inventory.paper_a4} sheets</div>
          <div><strong>A3 Paper:</strong> {inventory.paper_a3} sheets</div>
          <div><strong>Black Ink:</strong> {inventory.ink_black}%</div>
          <div><strong>Color Ink:</strong> {inventory.ink_color}%</div>
          <div><strong>Staples:</strong> {inventory.staples} boxes</div>
          <div><strong>Paper Clips:</strong> {inventory.paper_clips} boxes</div>
          <div><strong>Binding Materials:</strong> {inventory.binding_materials} sets</div>
          <div><strong>Maintenance Kits:</strong> {inventory.maintenance_kits}</div>
        </div>
      </div>
      
      {/* Update Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-2 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b px-4 py-3">
              <h3 className="text-lg font-medium">Update Inventory</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    A4 Paper (sheets)
                  </label>
                  <input
                    type="number"
                    name="paper_a4"
                    min="0"
                    value={formData.paper_a4}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    A3 Paper (sheets)
                  </label>
                  <input
                    type="number"
                    name="paper_a3"
                    min="0"
                    value={formData.paper_a3}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Black Ink (%)
                  </label>
                  <input
                    type="number"
                    name="ink_black"
                    min="0"
                    max="100"
                    value={formData.ink_black}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Ink (%)
                  </label>
                  <input
                    type="number"
                    name="ink_color"
                    min="0"
                    max="100"
                    value={formData.ink_color}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staples (boxes)
                  </label>
                  <input
                    type="number"
                    name="staples"
                    min="0"
                    value={formData.staples}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paper Clips (boxes)
                  </label>
                  <input
                    type="number"
                    name="paper_clips"
                    min="0"
                    value={formData.paper_clips}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Binding Materials (sets)
                  </label>
                  <input
                    type="number"
                    name="binding_materials"
                    min="0"
                    value={formData.binding_materials}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Kits
                  </label>
                  <input
                    type="number"
                    name="maintenance_kits"
                    min="0"
                    value={formData.maintenance_kits}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
