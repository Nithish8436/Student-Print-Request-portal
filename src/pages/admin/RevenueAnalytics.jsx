import React, { useState, useEffect } from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';

const RevenueAnalytics = () => {
  const { revenue } = usePrint();
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filteredRevenue, setFilteredRevenue] = useState(revenue);

  // Helper to check if a date is the same day
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  // Real-time filter: update filteredRevenue whenever revenue or dateRange changes
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
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
    const filtered = revenue.filter(item => {
      const itemDate = new Date(item.date);
      if (fromDate && toDate) {
        if (isSameDay(fromDate, toDate)) {
          return isSameDay(itemDate, fromDate);
        }
        return itemDate >= fromDate && itemDate <= toDate;
      }
      return true;
    });
    setFilteredRevenue(filtered);
  }, [revenue, dateRange]);

  // Calculate totals from filteredRevenue
  const totals = filteredRevenue.reduce(
    (acc, item) => {
      return {
        orders: acc.orders + item.orders,
        revenue: acc.revenue + item.revenue,
        expenses: acc.expenses + item.expenses,
        profit: acc.profit + item.profit
      };
    },
    { orders: 0, revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Revenue Analytics</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{totals.orders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totals.revenue}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">₹{totals.expenses}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm mb-1">Net Profit</p>
          <p className="text-3xl font-bold">₹{totals.profit}</p>
        </div>
      </div>
      <div className="h-80 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [`₹${value}`, name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRevenue.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.revenue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.expenses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ₹{item.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
