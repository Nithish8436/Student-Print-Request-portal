import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, Database, Save } from 'lucide-react';
import { toast } from 'sonner';

const Inventory = () => {
  // Paper
  const [paperA4, setPaperA4] = useState(0);
  const [paperA3, setPaperA3] = useState(0);
  // Ink
  const [inkBlack, setInkBlack] = useState(0);
  const [inkColor, setInkColor] = useState(0);
  // Other supplies
  const [staples, setStaples] = useState(0);
  const [paperClips, setPaperClips] = useState(0);
  const [bindingMaterials, setBindingMaterials] = useState(0);
  const [maintenanceKits, setMaintenanceKits] = useState(0);
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch current inventory from Supabase (assuming single row with id=1)
    const fetchInventory = async () => {
      setLoading(true);
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
      
      if (data) {
        setPaperA4(data.paper_a4 || 0);
        setPaperA3(data.paper_a3 || 0);
        setInkBlack(data.ink_black || 0);
        setInkColor(data.ink_color || 0);
        setStaples(data.staples || 0);
        setPaperClips(data.paper_clips || 0);
        setBindingMaterials(data.binding_materials || 0);
        setMaintenanceKits(data.maintenance_kits || 0);
      }
      setLoading(false);
    };
    fetchInventory();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.new) {
          setPaperA4(payload.new.paper_a4 || 0);
          setPaperA3(payload.new.paper_a3 || 0);
          setInkBlack(payload.new.ink_black || 0);
          setInkColor(payload.new.ink_color || 0);
          setStaples(payload.new.staples || 0);
          setPaperClips(payload.new.paper_clips || 0);
          setBindingMaterials(payload.new.binding_materials || 0);
          setMaintenanceKits(payload.new.maintenance_kits || 0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          paper_a4: paperA4,
          paper_a3: paperA3,
          ink_black: inkBlack,
          ink_color: inkColor,
          staples,
          paper_clips: paperClips,
          binding_materials: bindingMaterials,
          maintenance_kits: maintenanceKits
        })
        .eq('id', 1);
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Inventory updated successfully');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory.');
      toast.error('Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Inventory Management</h2>
      <p className="text-gray-600 mb-6">Update and monitor printer supplies and stock levels.</p>
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200 mb-6">
          <p className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Inventory updated successfully!
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 mb-6">
          <p className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paper Stock */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <div className="flex items-center mb-4">
            <Database className="mr-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Paper Stock</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">A4 Paper</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={paperA4}
                onChange={e => setPaperA4(Number(e.target.value))}
                required
              />
              <div className="flex items-center mt-1">
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${paperA4 < 100 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((paperA4 / 500) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">{paperA4} sheets</span>
              </div>
              {paperA4 < 100 && (
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Running low, consider restocking soon
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">A3 Paper</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={paperA3}
                onChange={e => setPaperA3(Number(e.target.value))}
                required
              />
              <div className="flex items-center mt-1">
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${paperA3 < 50 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((paperA3 / 250) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">{paperA3} sheets</span>
              </div>
              {paperA3 < 50 && (
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Running low, consider restocking soon
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Ink Levels */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <div className="flex items-center mb-4">
            <Database className="mr-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Ink Levels</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Black Ink</label>
              <input
                type="range"
                min="0"
                max="100"
                value={inkBlack}
                onChange={e => setInkBlack(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center mt-1">
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${inkBlack < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${inkBlack}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">{inkBlack}%</span>
              </div>
              {inkBlack < 20 && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Very low, replace cartridge immediately
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">Color Ink</label>
              <input
                type="range"
                min="0"
                max="100"
                value={inkColor}
                onChange={e => setInkColor(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center mt-1">
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${inkColor < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${inkColor}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">{inkColor}%</span>
              </div>
              {inkColor < 20 && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Very low, replace cartridge immediately
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Other Supplies */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <div className="flex items-center mb-4">
            <Database className="mr-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Other Supplies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Staples (boxes)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={staples}
                onChange={e => setStaples(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Paper Clips (boxes)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={paperClips}
                onChange={e => setPaperClips(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Binding Materials (sets)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={bindingMaterials}
                onChange={e => setBindingMaterials(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Maintenance Kits</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={maintenanceKits}
                onChange={e => setMaintenanceKits(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 flex items-center"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Inventory'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Inventory; 