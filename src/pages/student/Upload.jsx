import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrint } from '../../contexts/PrintContext';
import { Upload as UploadIcon, Plus, Minus, X } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [printType, setPrintType] = useState('Normal Xerox');
  const [copies, setCopies] = useState(1);
  const [colorPrint, setColorPrint] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { submitOrder, serverActive } = usePrint();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // Validate each file
    const validFiles = selectedFiles.filter(file => {
      // Check file type - only allow PDFs
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) return;
    
    // Validate each file
    const validFiles = droppedFiles.filter(file => {
      // Check file type - only allow PDFs
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    
    // Upload all files to Supabase Storage and collect their names and URLs
    const uploadedFiles = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: fileData2, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      uploadedFiles.push({ name: file.name, url: publicUrl });
    }
    
    // Submit a single order with all files
    const order = await submitOrder(
      uploadedFiles,
      printType,
      copies,
      colorPrint,
      doubleSided,
      message
    );
    if (order) {
      navigate(`/student/payment/${order.id}`);
    }
  };

  const incrementCopies = () => {
    setCopies(prev => Math.min(prev + 1, 100));
  };

  const decrementCopies = () => {
    setCopies(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Submit Print Order</h2>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Files</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                multiple
                className="hidden"
                disabled={!serverActive}
              />
              {files.length > 0 ? (
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <div className="text-green-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="mt-4 text-primary hover:text-indigo-700 text-sm font-medium"
                    onClick={handleFileInputClick}
                  >
                    Add more files
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-primary text-lg font-medium mb-1">Upload files</p>
                  <p className="text-sm text-gray-500 mb-4">or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  <button
                    type="button"
                    onClick={handleFileInputClick}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={!serverActive}
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Type</label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="Normal Xerox">Normal Xerox</option>
                <option value="Glossy Print">Glossy Print</option>
                <option value="Matte Print">Matte Print</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Copies</label>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={decrementCopies}
                  className="p-2 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="100"
                  className="w-full p-3 border-y focus:ring-primary focus:border-primary text-center"
                />
                <button 
                  type="button"
                  onClick={incrementCopies}
                  className="p-2 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center">
              <input
                id="colorPrint"
                type="checkbox"
                checked={colorPrint}
                onChange={(e) => setColorPrint(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="colorPrint" className="ml-2 block text-sm text-gray-700">
                Color Print
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="doubleSided"
                type="checkbox"
                checked={doubleSided}
                onChange={(e) => setDoubleSided(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="doubleSided" className="ml-2 block text-sm text-gray-700">
                Double Sided
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              placeholder="Any special instructions..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={!serverActive || files.length === 0}
            >
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;