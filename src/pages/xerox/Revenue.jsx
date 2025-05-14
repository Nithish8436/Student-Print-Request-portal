import React, { useState, useEffect } from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';

const Revenue = () => {
  const { orders, revenue } = usePrint();
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [filteredRevenue, setFilteredRevenue] = useState(revenue);

  // Helper to check if a date is the same day
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  // Real-time filter: update filteredOrders and filteredRevenue whenever orders, revenue, or dateRange changes
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      setFilteredOrders(orders);
      setFilteredRevenue(revenue);
      return;
    }
    let fromDate, toDate;
    if (dateRange.from && !dateRange.to) {
      // Single date selected
      fromDate = toDate = new Date(dateRange.from);
    } else if (dateRange.from && dateRange.to) {
      fromDate = new Date(dateRange.from);
      toDate = new Date(dateRange.to);
    }
    // Filter orders by created_at date
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (fromDate && toDate) {
        // If single day, match that day
        if (isSameDay(fromDate, toDate)) {
          return isSameDay(orderDate, fromDate);
        }
        // Range
        return orderDate >= fromDate && orderDate <= toDate;
      }
      return true;
    });
    setFilteredOrders(filtered);
    // Filter revenue analytics by date
    const filteredRev = revenue.filter(item => {
      const itemDate = new Date(item.date);
      if (fromDate && toDate) {
        if (isSameDay(fromDate, toDate)) {
          return isSameDay(itemDate, fromDate);
        }
        return itemDate >= fromDate && itemDate <= toDate;
      }
      return true;
    });
    setFilteredRevenue(filteredRev);
  }, [orders, revenue, dateRange]);

  // Calculate metrics using filteredOrders
  const totalOrders = filteredOrders.length;
  // For revenue, sum from filteredRevenue (for analytics) or from filteredOrders (for more accuracy)
  const totalRevenue = filteredRevenue.reduce((sum, r) => sum + r.revenue, 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

  // Orders by Print Type (from filteredOrders)
  const printTypeMap = {};
  filteredOrders.forEach(order => {
    const type = order.paper_size || 'Unknown';
    if (!printTypeMap[type]) printTypeMap[type] = 0;
    printTypeMap[type] += 1;
  });
  const printTypeData = Object.entries(printTypeMap).map(([type, count]) => ({ type, count }));

  // Order Status Breakdown (from filteredOrders)
  const statusMap = {};
  filteredOrders.forEach(order => {
    const status = order.status || 'Unknown';
    if (!statusMap[status]) statusMap[status] = 0;
    statusMap[status] += 1;
  });
  const statusData = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Revenue Overview</h2>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white shadow hover:bg-gray-50 transition-colors"
              aria-label="Filter by date"
            >
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span>Filter</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <div className="p-4 flex flex-col items-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range.from && range.to) setPopoverOpen(false);
                  if (range.from && !range.to) setPopoverOpen(false); // close on single date
                }}
                numberOfMonths={2}
                initialFocus
              />
              <button
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  setPopoverOpen(false);
                }}
              >
                Reset
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-500 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totalRevenue}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-500 text-sm mb-1">Average Order Value</p>
          <p className="text-3xl font-bold">₹{avgOrderValue}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Orders by Print Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={printTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6366f1" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Order Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Revenue; 