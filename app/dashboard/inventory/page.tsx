'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
  location?: string;
  supplier?: string;
  lastRestocked?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const result = await response.json();
        setItems(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.quantity < item.minQuantity) return 'low-stock';
    return 'in-stock';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getMarginPercentage = (item: InventoryItem): string => {
    if (item.costPrice === 0) return '0.0';
    return ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(1);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    const stockStatus = getStockStatus(item);
    const matchesStock = 
      filterStock === 'all' || 
      (filterStock === 'low' && (stockStatus === 'low-stock' || stockStatus === 'out-of-stock')) ||
      (filterStock === 'in-stock' && stockStatus === 'in-stock');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const lowStockCount = items.filter(item => getStockStatus(item) === 'low-stock' || getStockStatus(item) === 'out-of-stock').length;
  const inStockCount = items.filter(item => getStockStatus(item) === 'in-stock').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Loading Inventory" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage parts and supplies stock</p>
        </div>
        <PearlButton className="text-xs">
          <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
          Add Item
        </PearlButton>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="relative">
          <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low">Low/Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground mt-1">{items.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{inStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Alert</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'} need restocking
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Items are below minimum quantity or out of stock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item Details
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Margin
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Items Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterCategory !== 'all' || filterStock !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first inventory item to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const margin = getMarginPercentage(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div>
                          <p className={`text-sm font-semibold ${
                            stockStatus === 'out-of-stock' ? 'text-red-600 dark:text-red-400' :
                            stockStatus === 'low-stock' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-foreground'
                          }`}>
                            {item.quantity} {item.unit}
                          </p>
                          <p className="text-xs text-muted-foreground">Min: {item.minQuantity}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-foreground">₹{item.costPrice.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">+{item.gstRate}% GST</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-foreground">₹{item.sellingPrice.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {parseFloat(margin) > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            parseFloat(margin) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {margin}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStockColor(stockStatus)}`}>
                          {stockStatus === 'out-of-stock' ? 'OUT OF STOCK' :
                           stockStatus === 'low-stock' ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
