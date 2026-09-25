"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import POSHeader from '@/components/pos/POSHeader';
import { 
  Package, Plus, Search, Filter, Edit2, Trash2, Loader2, 
  Image as ImageIcon, FolderPlus, ToggleLeft, ToggleRight, 
  CheckCircle2, DollarSign, Check, Leaf, Heart, ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function POSInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    isActive: true,
    isKosher: false,
    isHalal: false,
    isVegan: false,
    isGlutenFree: false
  });

  const [catName, setCatName] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const presets = {
    'Gastronomía': ['Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Cafetería'],
    'Tienda de Ropa': ['Hombre', 'Mujer', 'Accesorios', 'Calzado', 'Temporada'],
    'Electrónica': ['Smartphones', 'Laptops', 'Audio', 'Gaming', 'Componentes'],
    'Salud y Belleza': ['Cuidado Facial', 'Maquillaje', 'Perfumería', 'Higiene'],
    'Ferretería': ['Herramientas', 'Pinturas', 'Electricidad', 'Plomería']
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, confRes] = await Promise.all([
        fetch('/api/pos/products'),
        fetch('/api/pos/categories'),
        fetch('/api/pos/config')
      ]);
      const [pDataJson, cDataJson, confDataJson] = await Promise.all([pRes.json(), cRes.json(), confRes.json()]);
      
      if (pDataJson.success) setProducts(pDataJson.data);
      if (cDataJson.success) setCategories(cDataJson.data);
      if (confDataJson.success) setConfig(confDataJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreset = async (set: string[]) => {
    setSubmitting(true);
    try {
      for (const name of set) {
        await fetch('/api/pos/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
      }
      setToast({ visible: true, message: 'Categorías añadidas', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ visible: true, message: 'Error al añadir categorías', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (showProductModal || showCategoryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProductModal, showCategoryModal]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ visible: true, message: 'El archivo excede los 5MB', type: 'error' });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/pos/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, imageUrl: data.url });
        setToast({ visible: true, message: 'Imagen subida', type: 'success' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al subir imagen', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const toggleDiet = (id: string) => {
    const newData = { ...formData, [id]: !formData[id as keyof typeof formData] };
    
    if (id === 'isGlutenFree' && newData.isGlutenFree) {
      newData.isKosher = false;
      newData.isHalal = false;
      newData.isVegan = false;
    } else if (newData[id as keyof typeof formData]) {
      if (id === 'isKosher' || id === 'isHalal' || id === 'isVegan') {
        newData.isGlutenFree = false;
      }
      if (id === 'isKosher') newData.isHalal = false;
      if (id === 'isHalal') newData.isKosher = false;
    }
    
    setFormData(newData);
  };

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      costPrice: '',
      stock: '',
      imageUrl: '',
      categoryId: '',
      isActive: true,
      isKosher: false,
      isHalal: false,
      isVegan: false,
      isGlutenFree: false
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name || '',
      description: p.description || '',
      price: p.price ? p.price.toString() : '',
      costPrice: p.costPrice ? p.costPrice.toString() : '0',
      stock: p.stock ? p.stock.toString() : '0',
      imageUrl: p.imageUrl || '',
      categoryId: p.categoryId || '',
      isActive: p.isActive ?? true,
      isKosher: p.isKosher ?? false,
      isHalal: p.isHalal ?? false,
      isVegan: p.isVegan ?? false,
      isGlutenFree: p.isGlutenFree ?? false
    });
    setShowProductModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingProductId ? `/api/pos/products/${editingProductId}` : '/api/pos/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: editingProductId ? 'Producto actualizado' : 'Producto creado', type: 'success' });
        setShowProductModal(false);
        setEditingProductId(null);
        setFormData({ 
          name: '', description: '', price: '', costPrice: '', stock: '', imageUrl: '', 
          categoryId: '', isActive: true, isKosher: false, isHalal: false, 
          isVegan: false, isGlutenFree: false 
        });
        fetchData();
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al procesar producto', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    try {
      const res = await fetch(`/api/pos/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: 'Producto eliminado', type: 'success' });
        fetchData();
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al eliminar producto', type: 'error' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: 'Categoría creada', type: 'success' });
        setShowCategoryModal(false);
        setCatName('');
        fetchData();
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al crear categoría', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <POSHeader />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-4">
              <Package className="w-3 h-3" /> Control de Stock
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">Inventario</h1>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto">
            <Link
              href="/dashboard/pos"
              className="w-full sm:w-auto h-14 px-6 bg-white/5 border border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
            >
              <LayoutDashboard size={16} className="text-gold" />
              Volver al POS
            </Link>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full sm:w-auto h-14 px-6 bg-bg-secondary border border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:border-gold/30 transition-all"
            >
              <FolderPlus size={16} className="text-gold" />
              Nueva Categoría
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto h-14 px-8 bg-gold hover:bg-gold-light text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-gold/20"
            >
              <Plus size={18} />
              Agregar Producto
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Cargando inventario...</p>
          </div>
        ) : (
          <div className="bg-bg-secondary border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
               <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en el inventario..."
                  className="w-full h-12 bg-bg-primary border border-white/5 rounded-xl pl-12 pr-4 text-white outline-none focus:border-gold/30 transition-all"
                />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4 md:mt-0">
                Total: <span className="text-white">{filteredProducts.length} productos</span> en <span className="text-white">{categories.length} categorías</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Producto</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Dietarios</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Categoría</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Costo</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Precio</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Stock</th>
                    <th className="p-4 md:p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group" style={{ opacity: p.isActive ? 1 : 0.5 }}>
                      <td className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><Package size={20}/></div>}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-gold transition-colors">{p.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter line-clamp-1">{p.description || 'Sin descripción'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6 hidden sm:table-cell">
                        <div className="flex gap-1.5">
                          {p.isKosher && <div title="Kosher" className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center text-[8px] font-black border border-blue-500/20">K</div>}
                          {p.isHalal && <div title="Halal" className="w-6 h-6 rounded-md bg-green-500/10 text-green-400 flex items-center justify-center text-[8px] font-black border border-green-500/20">H</div>}
                          {p.isVegan && <div title="Vegano" className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"><Leaf size={12} /></div>}
                          {p.isGlutenFree && <div title="Sin TACC" className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20"><ShieldCheck size={12} /></div>}
                        </div>
                      </td>
                      <td className="p-4 md:p-6 hidden sm:table-cell">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 hidden sm:table-cell">
                        <span className="font-mono font-bold text-gray-400">{config?.currency || '$'} {Number(p.costPrice || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className="font-mono font-bold text-gold">{config?.currency || '$'} {Number(p.price).toFixed(2)}</span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-white'}`}>{p.stock}</span>
                      </td>
                      <td className="p-4 md:p-6 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleOpenEditModal(p)}
                             className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 transition-all"
                           >
                            <Edit2 size={16} />
                          </button>
                           <button 
                             onClick={() => handleDeleteClick(p.id)}
                             className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500/30 transition-all"
                           >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center text-gray-700 opacity-30">
                  <Package size={80} className="mx-auto mb-4" strokeWidth={1} />
                  <p className="font-black uppercase tracking-widest text-xs">No hay productos registrados</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowProductModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-3xl bg-bg-secondary border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <form onSubmit={handleFormSubmit} className="p-6 md:p-10 space-y-8 overflow-y-auto custom-scrollbar pr-8">
                <header className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{editingProductId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Registra los detalles del artículo de tu catálogo.</p>
                  </div>
                  <button type="button" onClick={() => setShowProductModal(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">✕</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Nombre del Producto</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setShowCatDropdown(!showCatDropdown)}
                      className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white flex items-center justify-between outline-none hover:border-white/20 transition-all"
                    >
                      <span className={formData.categoryId ? 'text-white' : 'text-gray-500 font-bold'}>
                        {categories.find(c => c.id === formData.categoryId)?.name || 'Seleccionar Categoría'}
                      </span>
                      <Filter size={16} className={showCatDropdown ? 'text-gold rotate-180' : 'text-gray-500'} />
                    </button>
                    
                    <AnimatePresence>
                      {showCatDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                            <button
                              type="button"
                              onClick={() => { setFormData({ ...formData, categoryId: '' }); setShowCatDropdown(false); }}
                              className="w-full px-4 py-3 text-left hover:bg-white/5 rounded-xl text-xs font-bold text-gray-400 transition-colors"
                            >
                              Sin Categoría
                            </button>
                            {categories.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setFormData({ ...formData, categoryId: c.id }); setShowCatDropdown(false); }}
                                className={`w-full px-4 py-3 text-left rounded-xl text-xs font-bold transition-all ${formData.categoryId === c.id ? 'bg-gold text-black' : 'text-white hover:bg-white/5'}`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowCategoryModal(true); setShowCatDropdown(false); }}
                            className="w-full p-4 bg-bg-tertiary text-[10px] font-black text-gold uppercase tracking-widest border-t border-white/5 flex items-center justify-center gap-2 hover:bg-gold hover:text-primary-foreground transition-all"
                          >
                            <Plus size={14} /> Nueva Categoría
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Precio de Venta ({config?.currency || 'USD'})</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl pl-12 pr-5 text-white outline-none focus:border-gold/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Precio de Costo / Compra ({config?.currency || 'USD'})</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl pl-12 pr-5 text-white outline-none focus:border-gold/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Stock de Inventario</label>
                    <input
                      required
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all font-mono"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Imagen del Producto (Máx 5MB)</label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="URL o sube un archivo"
                          className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl pl-12 pr-5 text-white outline-none focus:border-gold/30 transition-all text-xs"
                        />
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all border border-white/5 text-[8px] font-black uppercase tracking-widest">
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Subir'}
                          <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                      </div>
                      {formData.imageUrl && (
                        <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Certificaciones y Dieta</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { id: 'isKosher', label: 'Kosher', icon: ShieldCheck, color: 'text-blue-400' },
                        { id: 'isHalal', label: 'Halal', icon: Heart, color: 'text-green-400' },
                        { id: 'isVegan', label: 'Vegano', icon: Leaf, color: 'text-emerald-400' },
                        { id: 'isGlutenFree', label: 'Sin TACC', icon: Check, color: 'text-amber-400' },
                      ].map((diet) => (
                        <button
                          key={diet.id}
                          type="button"
                          onClick={() => toggleDiet(diet.id)}
                          className={`h-14 rounded-2xl border flex items-center gap-3 px-4 transition-all ${formData[diet.id as keyof typeof formData] ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 opacity-40 hover:opacity-100'}`}
                        >
                          <diet.icon size={16} className={formData[diet.id as keyof typeof formData] ? diet.color : 'text-gray-500'} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{diet.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full h-24 bg-bg-primary border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-gold/30 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                   <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`flex-1 h-16 rounded-2xl border flex items-center justify-center gap-3 transition-all font-black uppercase tracking-widest text-[10px] ${formData.isActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-gray-500/10 border-white/5 text-gray-500'}`}
                  >
                    {formData.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {formData.isActive ? 'Producto Activo' : 'Inactivo'}
                  </button>
                  <button
                    disabled={submitting || uploading}
                    className="flex-[2] h-16 bg-gold hover:bg-gold-light text-primary-foreground font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
                    {editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowCategoryModal(false)} />
             <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-xl bg-bg-secondary border border-white/10 rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <header className="mb-10">
                <h2 className="text-3xl font-bold mb-2 text-white">Gestión de Categorías</h2>
                <p className="text-sm text-gray-500">Añade categorías personalizadas o usa nuestros ajustes preestablecidos.</p>
              </header>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Nueva Categoría Manual</label>
                  <div className="flex gap-4">
                    <input
                      autoFocus
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Ej: Bebidas, Postres..."
                      className="flex-1 h-16 bg-bg-primary border border-white/5 rounded-2xl px-6 text-white outline-none focus:border-gold/30 transition-all font-bold"
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={!catName || submitting}
                      className="w-16 h-16 bg-gold text-primary-foreground rounded-2xl flex items-center justify-center hover:bg-gold-light transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus size={24} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Presets por Industria</label>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(presets).map(([name, set]) => (
                      <button
                        key={name}
                        onClick={() => handleAddPreset(set)}
                        disabled={submitting}
                        className="p-5 bg-white/5 border border-white/5 rounded-[1.5rem] text-left hover:border-gold/40 hover:bg-white/10 transition-all group disabled:opacity-50"
                      >
                        <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-gold transition-colors mb-1">{name}</p>
                        <p className="text-[9px] text-gray-500 line-clamp-1">{set.join(', ')}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full h-14 bg-white/5 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:text-white transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Producto?"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}
// creado por pato dev y askforvini
