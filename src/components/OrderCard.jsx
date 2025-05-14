import React from 'react';
import { Clock, FileText, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OrderCard = ({ order, showProgress }) => {
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Get status icon based on order status
  const getStatusIcon = () => {
    if (order.status === 'Pending Payment') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else if (order.status === 'Processing' || order.status.includes('Processing')) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    } else if (order.status === 'Ready for Pickup') {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (order.status === 'Completed' || order.status === 'Delivered') {
      return <Check className="h-5 w-5 text-purple-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  // Get file name from file URL
  const getFileName = () => {
    if (order.file_name) return order.file_name;
    
    if (order.file_url) {
      const urlParts = order.file_url.split('/');
      return urlParts[urlParts.length - 1];
    }
    
    return 'Document';
  };

  // Handler to open the original document with a signed URL
  const handleOpenDocument = async (documentUrl, e) => {
    e.preventDefault();
    if (!documentUrl) {
      toast.error("No document URL found for this file");
      return;
    }
    const urlParts = documentUrl.split('/');
    const documentsIndex = urlParts.indexOf('documents');
    if (documentsIndex === -1) {
      toast.error("Invalid document URL format");
      return;
    }
    const filePath = urlParts.slice(documentsIndex + 1).join('/');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);
    if (signedUrlError) {
      toast.error("Failed to generate signed URL");
      return;
    }
    window.open(signedUrlData.signedUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-full mr-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              {/* Show all files if present, else fallback to legacy */}
              {Array.isArray(order.files) && order.files.length > 0 ? (
                <div>
                  <div className="font-medium mb-1">Files:</div>
                  <ul className="ml-2 list-disc">
                    {order.files.map((file, idx) => (
                      <li key={idx} className="truncate">
                        <a
                          href="#"
                          onClick={e => handleOpenDocument(file.url, e)}
                          className="text-primary hover:underline"
                        >
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <h3 className="font-medium">{getFileName()}</h3>
              )}
              <p className="text-sm text-gray-500">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {order.otp && (
              <div className="mr-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                OTP: {order.otp}
              </div>
            )}
            
            <div className={`px-3 py-1 rounded-full text-sm 
              ${order.status === 'Pending Payment' ? 'bg-yellow-100 text-yellow-800' : 
                order.status.includes('Processing') ? 'bg-blue-100 text-blue-800' :
                order.status === 'Ready for Pickup' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'}`
            }>
              {getStatusIcon()}
              <span className="ml-1">{order.status}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-xs text-gray-500">Print Type</div>
            <div className="font-medium">{order.paper_size}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500">Copies</div>
            <div className="font-medium">{order.copies}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500">Options</div>
            <div className="font-medium">
              {order.is_color_print ? 'Color' : 'Black & White'}
              {order.is_double_sided && ', Double-sided'}
            </div>
          </div>
        </div>
        
        {order.notes && (
          <div className="mt-3 text-sm text-gray-600">
            <div className="text-xs text-gray-500">Notes:</div>
            <p className="mt-1">{order.notes}</p>
          </div>
        )}
        
        {showProgress && order.status.includes('Processing') && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Processing</span>
              <span>Complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: order.status.includes('Processing') && order.status.match(/\d+/) 
                  ? `${order.status.match(/\d+/)[0]}%` 
                  : '50%' 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
