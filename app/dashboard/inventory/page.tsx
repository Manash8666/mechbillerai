'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown, X, FileUp, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
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

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Lubricants');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('Liters');
  const [costPrice, setCostPrice] = useState('350');
  const [sellingPrice, setSellingPrice] = useState('500');
  const [gstRate, setGstRate] = useState('18');

  // Edit Item Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('Lubricants');
  const [editQuantity, setEditQuantity] = useState('0');
  const [editUnit, setEditUnit] = useState('Pcs');
  const [editCostPrice, setEditCostPrice] = useState('0');
  const [editSellingPrice, setEditSellingPrice] = useState('0');
  const [editGstRate, setEditGstRate] = useState('18');
  const [updatingItem, setUpdatingItem] = useState(false);

  useEffect(() => {
    void fetchInventory();
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Item name and SKU/Code are required');
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId') || 'cmv4zl4620001d96sd1e0qto2';

      const payload = {
        userId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        quantity: Number(quantity) || 0,
        unit,
        minQuantity: 5,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        gstRate: Number(gstRate) || 18,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create item');
      }

      toast.success(`Item "${name}" added to inventory!`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      await fetchInventory();
    } catch (err: any) {
      console.error('Error adding inventory item:', err);
      toast.error(err.message || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}" from inventory?`)) {
      return;
    }
    const toastId = toast.loading(`Deleting ${itemName}...`);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`"${itemName}" deleted from inventory`, { id: toastId });
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || err.message || 'Failed to delete item', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error deleting item', { id: toastId });
    }
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditCode(item.code || '');
    setEditCategory(item.category || 'Lubricants');
    setEditQuantity(String(item.quantity ?? 0));
    setEditUnit(item.unit || 'Pcs');
    setEditCostPrice(String(item.costPrice ?? 0));
    setEditSellingPrice(String(item.sellingPrice ?? 0));
    setEditGstRate(String(item.gstRate ?? 18));
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim() || !editCode.trim()) {
      toast.error('Item name and SKU/Code are required');
      return;
    }

    try {
      setUpdatingItem(true);
      const payload = {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        category: editCategory,
        quantity: Number(editQuantity) || 0,
        unit: editUnit,
        costPrice: Number(editCostPrice) || 0,
        sellingPrice: Number(editSellingPrice) || 0,
        gstRate: Number(editGstRate) || 18,
      };

      const res = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to update item');
      }

      toast.success(`Item "${editName}" updated!`);
      setIsEditModalOpen(false);
      setEditingItem(null);
      await fetchInventory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating inventory item');
    } finally {
      setUpdatingItem(false);
    }
  };

  const categories = Array.from(new Set(items.map((item) => item.category)));

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

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    const stockStatus = getStockStatus(item);
    const matchesStock =
      filterStock === 'all' ||
      (filterStock === 'in-stock' && stockStatus === 'in-stock') ||
      (filterStock === 'low' && (stockStatus === 'low-stock' || stockStatus === 'out-of-stock'));

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const lowStockCount = items.filter((item) => item.quantity < item.minQuantity && item.quantity > 0).length;
  const outOfStockCount = items.filter((item) => item.quantity === 0).length;

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <FileUp className="w-4 h-4" />
            Import Stock / Vyapar
          </Link>
          <PearlButton onClick={() => setIsModalOpen(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
            Add Item
          </PearlButton>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by name, code, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold placeholder:text-luxury-ink-light/50 dark:placeholder:text-luxury-ink-dark/50"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="relative">
          <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 pointer-events-none" />
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold appearance-none cursor-pointer"
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
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{outOfStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const margin = (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(1);

                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-foreground">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              item.quantity === 0
                                ? 'text-red-600 dark:text-red-400'
                                : item.quantity < item.minQuantity
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-foreground'
                            }`}
                          >
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
                          {Number.parseFloat(margin) > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              Number.parseFloat(margin) > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {margin}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStockColor(stockStatus)}`}>
                          {stockStatus === 'out-of-stock'
                            ? 'OUT OF STOCK'
                            : stockStatus === 'low-stock'
                            ? 'LOW STOCK'
                            : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                            title="Edit Inventory Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                            title="Delete Inventory Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-luxury-gold/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Add Inventory Item</h2>
              <p className="text-sm text-muted-foreground mt-1">Track parts, oils, consumables and spares</p>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic Engine Oil 5W-40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    SKU / Item Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OIL-5W40-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="Lubricants">Lubricants</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Filters">Filters</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="Liters">Liters</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Sets">Sets</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Selling (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <PearlButton type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Save Item'}
                </PearlButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inventory Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Edit Inventory Item</h2>
                <p className="text-xs text-muted-foreground">SKU: {editingItem.code}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    SKU / Item Code *
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Lubricants">Lubricants</option>
                    <option value="Engine Parts">Engine Parts</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Filters">Filters</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Tires">Tires</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Unit
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Liters">Liters</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Sets">Sets</option>
                    <option value="Meters">Meters</option>
                    <option value="Kg">Kg</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    value={editGstRate}
                    onChange={(e) => setEditGstRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="w-1/2 py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingItem}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingItem ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
