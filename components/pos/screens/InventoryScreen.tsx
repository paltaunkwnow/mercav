"use client";

import { useState, useEffect } from 'react';
import POSHeader from '@/components/pos/POSHeader';
import { 
  Package, Plus, Search, Edit2, Trash2, Loader2, 
  Image as ImageIcon, FolderPlus, ToggleLeft, ToggleRight, 
  CheckCircle2, Check, Leaf, Heart, ShieldCheck, ChevronDown, X, Star
} from '@/components/icons';
import { Toast } from '@/components/ui/toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { BUSINESS_TYPES, UNITS, formatQuantity, getBusinessType, getUnit } from '@/lib/pos/business';
import { formatMoney } from '@/lib/pos/money';
import { KOSHER_STOCK_CATEGORIES, isLowStock } from '@/lib/pos/stock';
import { useManagerPin } from '@/components/pos/useManagerPin';
import { posFetch } from '@/lib/pos/client';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  costPrice: '',
  stock: '',
  sku: '',
  barcode: '',
  unit: 'UNIT',
  trackStock: true,
  taxRate: '',
  imageUrl: '',
  categoryId: '',
  isActive: true,
  isKosher: false,
  isHalal: false,
  isVegan: false,
  isGlutenFree: false,
  minStock: '',
  kosherCategory: ''
};

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

  const [formData, setFormData] = useState(EMPTY_FORM);

  const { pinFetch, pinDialog } = useManagerPin();
  const [kosher, setKosher] = useState<{ places: { id: string; name: string; city: string }[]; linkedPlaceId: string | null; shabbatLocked: boolean; preview: { category: string; label: string; count: number }[] } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [catName, setCatName] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const business = getBusinessType(config?.businessType);
  const presets = [business, ...BUSINESS_TYPES.filter((b) => b.id !== business.id)];
  const showDietary = business.dietary || formData.isKosher || formData.isHalal || formData.isVegan || formData.isGlutenFree;
  const showUnits = business.weighted || formData.unit !== 'UNIT';
  const formUnit = getUnit(formData.unit);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, confRes] = await Promise.all([
        posFetch('/api/pos/products'),
        posFetch('/api/pos/categories'),
        posFetch('/api/pos/config')
      ]);
      const [pDataJson, cDataJson, confDataJson] = await Promise.all([pRes.json(), cRes.json(), confRes.json()]);
      
      if (pDataJson.success) setProducts(pDataJson.data);
      if (cDataJson.success) setCategories(cDataJson.data);
      if (confDataJson.success) setConfig(confDataJson.data);
      if (confDataJson.success && confDataJson.data?.kosherPlaceId) {
        const k = await posFetch('/api/pos/kosher').then((r) => r.json()).catch(() => null);
        if (k?.success) setKosher(k.data);
      }
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
        await pinFetch('/api/pos/categories', {
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

  // Escape closes the topmost dialog
  useEffect(() => {
    if (!showProductModal && !showCategoryModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showCategoryModal) setShowCategoryModal(false);
      else if (showCatDropdown) setShowCatDropdown(false);
      else setShowProductModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProductModal, showCategoryModal, showCatDropdown]);

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
      const res = await posFetch('/api/pos/upload', {
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
    setFormData({ ...EMPTY_FORM, trackStock: business.tracksStockByDefault });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name || '',
      description: p.description || '',
      price: p.price ? p.price.toString() : '',
      costPrice: p.costPrice ? p.costPrice.toString() : '0',
      stock: p.stock ? Number(p.stock).toString() : '0',
      sku: p.sku || '',
      barcode: p.barcode || '',
      unit: p.unit || 'UNIT',
      trackStock: p.trackStock ?? true,
      taxRate: p.taxRate === null || p.taxRate === undefined ? '' : Number(p.taxRate).toString(),
      imageUrl: p.imageUrl || '',
      categoryId: p.categoryId || '',
      isActive: p.isActive ?? true,
      isKosher: p.isKosher ?? false,
      isHalal: p.isHalal ?? false,
      isVegan: p.isVegan ?? false,
      isGlutenFree: p.isGlutenFree ?? false,
      minStock: p.minStock === null || p.minStock === undefined ? '' : Number(p.minStock).toString(),
      kosherCategory: p.kosherCategory || ''
    });
    setShowProductModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingProductId ? `/api/pos/products/${editingProductId}` : '/api/pos/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await pinFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: editingProductId ? 'Producto actualizado' : 'Producto creado', type: 'success' });
        setShowProductModal(false);
        setEditingProductId(null);
        setFormData(EMPTY_FORM);
        fetchData();
      } else {
        setToast({ visible: true, message: data.error || 'Error al procesar producto', type: 'error' });
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
      const res = await pinFetch(`/api/pos/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: data.archived ? 'Tiene ventas registradas: quedó archivado' : 'Producto eliminado', type: 'success' });
        fetchData();
      } else if (data.error) {
        setToast({ visible: true, message: data.error, type: 'error' });
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
      const res = await pinFetch('/api/pos/categories', {
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

  const handlePublishKosher = async () => {
    setPublishing(true);
    try {
      const res = await pinFetch('/api/pos/kosher', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setToast({ visible: true, message: `Publicado en ${data.data.placeName}: ${data.data.reports.map((r: { label: string }) => r.label).join(', ')}`, type: 'success' });
      } else {
        setToast({ visible: true, message: data?.error || 'No pudimos publicar el stock', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Sin conexión. Probá de nuevo en un rato.', type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(term) ||
    (p.description && p.description.toLowerCase().includes(term)) ||
    (p.sku && p.sku.toLowerCase().includes(term)) ||
    (p.barcode && p.barcode.includes(term))
  );

  const currency = config?.currency;
  const fieldLabel = 'block text-sm font-semibold text-[var(--text-secondary)]';
  const hint = 'font-normal text-[var(--text-tertiary)]';
  const iconBtn = 'mv-focus grid h-11 w-11 place-items-center rounded-xl border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] transition-colors duration-150';
  const plainBtn = 'mv-btn border border-[var(--mv-hairline-strong)] text-[var(--text-primary)] hover:border-[var(--color-border-gold)]';
  const dietBadges = (p: any) => (
    <span className="flex gap-1">
      {p.isKosher && <span title="Kosher" className="mv-chip h-6 px-2">Kosher</span>}
      {p.isHalal && <span title="Halal" className="mv-chip h-6 px-2">Halal</span>}
      {p.isVegan && <span title="Vegano" className="mv-chip h-6 px-2"><Leaf size={11} aria-hidden />Vegano</span>}
      {p.isGlutenFree && <span title="Sin TACC" className="mv-chip h-6 px-2">Sin TACC</span>}
    </span>
  );
  const stockCell = (p: any) => {
    if (!p.trackStock) return <span className="text-sm text-[var(--text-secondary)]">Sin control</span>;
    const out = Number(p.stock) <= 0;
    const low = isLowStock(p);
    return (
      <span className={`mv-data text-sm font-semibold ${out || low ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
        {formatQuantity(p.stock, p.unit)}
        {(out || low) && <span className="ml-1.5 font-sans text-xs font-medium">{out ? 'Agotado' : 'Stock bajo'}</span>}
      </span>
    );
  };
  const codes = (p: any) => [p.sku && `SKU ${p.sku}`, p.barcode].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-bg-primary text-[var(--text-primary)]">
      <POSHeader />

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:pt-12">
        <header className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="mv-kicker">Inventario</p>
            <h1 className="mv-h2">Productos y stock</h1>
            {!loading && (
              <p className="mv-body">
                <span className="mv-data text-[var(--text-primary)]">{products.length}</span> {products.length === 1 ? 'producto' : 'productos'} en{' '}
                <span className="mv-data text-[var(--text-primary)]">{categories.length}</span> {categories.length === 1 ? 'categoría' : 'categorías'}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setShowCategoryModal(true)} className={`${plainBtn} w-full sm:w-auto`}>
              <FolderPlus size={18} className="text-gold" aria-hidden />
              Categorías
            </button>
            <button type="button" onClick={handleOpenCreateModal} className="mv-btn mv-btn-primary w-full sm:w-auto">
              <Plus size={18} aria-hidden />
              Agregar producto
            </button>
          </div>
        </header>

        {!loading && kosher?.linkedPlaceId && (
          <section aria-labelledby="kosher-publish-title" className="mv-panel mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <h2 id="kosher-publish-title" className="text-base font-semibold text-[var(--text-primary)]">
                Mercav Kosher · {kosher.places.find((pl) => pl.id === kosher.linkedPlaceId)?.name ?? 'lugar vinculado'}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {kosher.preview.length
                  ? <>Se publica qué hay disponible: {kosher.preview.map((c) => `${c.label} (${c.count})`).join(', ')}.</>
                  : 'Asigná una categoría Kosher a tus productos con stock para poder publicarlos.'}
                {' '}Es un aviso de disponibilidad: Mercav no emite hechsher ni certifica productos.
              </p>
              {kosher.shabbatLocked && <p className="mt-1 text-sm font-medium text-gold">Tu modo Shabat está activo: podés publicar después de Havdalá.</p>}
            </div>
            <button
              type="button"
              onClick={handlePublishKosher}
              disabled={publishing || kosher.shabbatLocked || kosher.preview.length === 0}
              className="mv-btn mv-btn-sm w-full shrink-0 border border-[var(--mv-hairline-strong)] text-[var(--text-primary)] sm:w-auto"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Star size={16} className="text-gold" aria-hidden />}
              {publishing ? 'Publicando…' : 'Publicar stock en Mercav Kosher'}
            </button>
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24" role="status">
            <Loader2 className="w-8 h-8 text-gold animate-spin" aria-hidden />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Cargando inventario…</p>
          </div>
        ) : (
          <div className="mv-panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--mv-hairline)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="relative w-full sm:max-w-md">
                <label htmlFor="inventory-search" className="sr-only">Buscar en el inventario</label>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} aria-hidden />
                <input
                  id="inventory-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código de barras"
                  autoComplete="off"
                  className="mv-input pl-11"
                />
              </div>
              {term && (
                <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                  <span className="mv-data text-[var(--text-primary)]">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                </p>
              )}
            </div>

            {filteredProducts.length > 0 && (
              <>
                {/* Tablet and desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--mv-hairline)] text-xs font-semibold text-[var(--text-secondary)]">
                        <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                        {business.dietary && <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Dietarios</th>}
                        <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Categoría</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Costo</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Precio</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Stock</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Acciones</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--mv-hairline)]">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className={`transition-colors duration-150 hover:bg-[var(--mv-panel-hover)] ${p.isActive ? '' : 'opacity-60'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--color-bg-tertiary)] text-[var(--text-tertiary)]">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Package size={18} aria-hidden />}
                              </div>
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                                  <span className="truncate">{p.name}</span>
                                  {!p.isActive && <span className="mv-chip h-6 shrink-0 px-2">Archivado</span>}
                                </p>
                                <p className="mv-data line-clamp-1 text-xs text-[var(--text-secondary)]">
                                  {codes(p) || <span className="font-sans">{p.description || 'Sin código'}</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          {business.dietary && <td className="hidden px-4 py-3 lg:table-cell">{dietBadges(p)}</td>}
                          <td className="hidden px-4 py-3 text-sm text-[var(--text-secondary)] lg:table-cell">{p.category?.name || 'General'}</td>
                          <td className="mv-data px-4 py-3 text-right text-sm text-[var(--text-secondary)]">{formatMoney(p.costPrice, currency)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="mv-data text-sm font-semibold text-[var(--text-primary)]">{formatMoney(p.price, currency)}</span>
                            {p.unit && p.unit !== 'UNIT' && <span className="text-xs text-[var(--text-secondary)]"> / {getUnit(p.unit).short}</span>}
                          </td>
                          <td className="px-4 py-3 text-right">{stockCell(p)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => handleOpenEditModal(p)} aria-label={`Editar ${p.name}`} className={`${iconBtn} hover:border-[var(--color-border-gold)] hover:text-gold`}>
                                <Edit2 size={16} aria-hidden />
                              </button>
                              <button type="button" onClick={() => handleDeleteClick(p.id)} aria-label={`Eliminar ${p.name}`} className={`${iconBtn} hover:border-red-500/30 hover:text-red-400`}>
                                <Trash2 size={16} aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phone: cards */}
                <ul className="divide-y divide-[var(--mv-hairline)] md:hidden">
                  {filteredProducts.map((p) => (
                    <li key={p.id} className={`p-3 ${p.isActive ? '' : 'opacity-60'}`}>
                      <div className="flex gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--color-bg-tertiary)] text-[var(--text-tertiary)]">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Package size={20} aria-hidden />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{p.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {p.category?.name || 'General'}
                            {codes(p) && <span className="mv-data"> · {codes(p)}</span>}
                          </p>
                          {(!p.isActive || (business.dietary && (p.isKosher || p.isHalal || p.isVegan || p.isGlutenFree))) && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {!p.isActive && <span className="mv-chip h-6 px-2">Archivado</span>}
                              {business.dietary && dietBadges(p)}
                            </div>
                          )}
                        </div>
                        <div className="-mr-1 flex shrink-0 flex-col gap-1.5 min-[380px]:flex-row">
                          <button type="button" onClick={() => handleOpenEditModal(p)} aria-label={`Editar ${p.name}`} className={iconBtn}>
                            <Edit2 size={16} aria-hidden />
                          </button>
                          <button type="button" onClick={() => handleDeleteClick(p.id)} aria-label={`Eliminar ${p.name}`} className={`${iconBtn} hover:text-red-400`}>
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl bg-[var(--mv-panel)] px-3 py-2">
                        <dl className="grid min-w-0 grid-cols-3 gap-x-3">
                          <div className="min-w-0">
                            <dt className="text-xs text-[var(--text-secondary)]">Precio</dt>
                            <dd className="mv-data truncate text-sm font-semibold text-[var(--text-primary)]">{formatMoney(p.price, currency)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs text-[var(--text-secondary)]">Costo</dt>
                            <dd className="mv-data truncate text-sm text-[var(--text-secondary)]">{formatMoney(p.costPrice, currency)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs text-[var(--text-secondary)]">Stock</dt>
                            <dd>{stockCell(p)}</dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center px-6 py-16 text-center" role="status">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--mv-panel)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[color:var(--mv-hairline-strong)]">
                  <Package size={26} strokeWidth={1.5} aria-hidden />
                </span>
                {products.length === 0 ? (
                  <>
                    <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">Todavía no cargaste productos</p>
                    <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">Agregá tu primer producto o servicio. Si querés, empezá creando las categorías sugeridas para tu rubro.</p>
                    <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button type="button" onClick={handleOpenCreateModal} className="mv-btn mv-btn-primary mv-btn-sm">
                        <Plus size={16} aria-hidden /> Agregar producto
                      </button>
                      <button type="button" onClick={() => setShowCategoryModal(true)} className={`${plainBtn} mv-btn-sm`}>
                        Crear categorías
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">Nada coincide con <span className="mv-data">“{searchTerm.trim()}”</span></p>
                    <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">Revisá el nombre o probá con el SKU o el código de barras.</p>
                    <button type="button" onClick={() => setSearchTerm('')} className={`${plainBtn} mv-btn-sm mt-5`}>
                      Limpiar búsqueda
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div className="mv-fade absolute inset-0 bg-black/50" onClick={() => setShowProductModal(false)} aria-hidden />
          <div className="mv-pop mv-menu relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem]">
            <form onSubmit={handleFormSubmit} className="custom-scrollbar space-y-6 overflow-y-auto p-5 sm:p-8">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="product-modal-title" className="mv-h3">{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Lo que cargues acá aparece en la caja y en el ticket.</p>
                </div>
                <button type="button" onClick={() => setShowProductModal(false)} aria-label="Cerrar" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                  <X size={20} aria-hidden />
                </button>
              </header>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="p-name" className={fieldLabel}>Nombre</label>
                  <input
                    id="p-name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoComplete="off"
                    className="mv-input"
                  />
                </div>
                <div className="relative space-y-2">
                  <span id="p-category-label" className={fieldLabel}>Categoría</span>
                  <button
                    type="button"
                    aria-labelledby="p-category-label p-category-value"
                    aria-haspopup="listbox"
                    aria-expanded={showCatDropdown}
                    onClick={() => setShowCatDropdown(!showCatDropdown)}
                    className="mv-input mv-focus flex items-center justify-between gap-3 text-left"
                  >
                    <span id="p-category-value" className={`truncate ${formData.categoryId ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                      {categories.find(c => c.id === formData.categoryId)?.name || 'Sin categoría'}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${showCatDropdown ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                  
                  {showCatDropdown && (
                    <div
                      className="mv-pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--mv-hairline-strong)] bg-[var(--color-bg-secondary)] shadow-2xl"
                      style={{ transformOrigin: 'top center' }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setShowCatDropdown(false); } }}
                    >
                      <ul className="custom-scrollbar max-h-60 overflow-y-auto p-1.5" role="listbox" aria-labelledby="p-category-label">
                        <li role="option" aria-selected={!formData.categoryId}>
                          <button
                            type="button"
                            onClick={() => { setFormData({ ...formData, categoryId: '' }); setShowCatDropdown(false); }}
                            className="mv-focus flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)]"
                          >
                            Sin categoría
                          </button>
                        </li>
                        {categories.map(c => (
                          <li key={c.id} role="option" aria-selected={formData.categoryId === c.id}>
                            <button
                              type="button"
                              onClick={() => { setFormData({ ...formData, categoryId: c.id }); setShowCatDropdown(false); }}
                              className={`mv-focus flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium hover:bg-[var(--mv-panel-hover)] ${formData.categoryId === c.id ? 'bg-[var(--mv-gold-wash)] text-gold' : 'text-[var(--text-primary)]'}`}
                            >
                              {c.name}
                              {formData.categoryId === c.id && <Check size={14} aria-hidden />}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => { setShowCategoryModal(true); setShowCatDropdown(false); }}
                        className="mv-focus flex h-12 w-full items-center justify-center gap-2 border-t border-[var(--mv-hairline)] text-sm font-semibold text-gold hover:bg-[var(--mv-panel-hover)]"
                      >
                        <Plus size={16} aria-hidden /> Nueva categoría
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="p-price" className={fieldLabel}>
                    Precio de venta <span className={hint}>{config?.currency || 'USD'}{formUnit.id !== 'UNIT' ? ` por ${formUnit.short}` : ''}, {config?.pricesIncludeTax === false ? 'sin' : 'con'} {config?.taxName || 'IVA'}</span>
                  </label>
                  <input
                    id="p-price"
                    required
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mv-input mv-data"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="p-cost" className={fieldLabel}>Costo de compra <span className={hint}>{config?.currency || 'USD'}</span></label>
                  <input
                    id="p-cost"
                    required
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="mv-input mv-data"
                  />
                </div>
                {showUnits && (
                  <div className="space-y-2">
                    <label htmlFor="unit" className={fieldLabel}>Se vende por</label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="mv-input"
                    >
                      {UNITS.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.short})</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="stock" className={fieldLabel}>
                      Stock{formUnit.id !== 'UNIT' ? <span className={hint}> ({formUnit.short})</span> : ''}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.trackStock}
                      onClick={() => setFormData({ ...formData, trackStock: !formData.trackStock })}
                      className="mv-focus -my-2 inline-flex h-11 items-center gap-2 rounded-full px-1 text-sm font-medium text-[var(--text-secondary)]"
                    >
                      <span className={`relative h-6 w-10 rounded-full transition-colors duration-200 ${formData.trackStock ? 'bg-gold' : 'bg-[var(--mv-hairline-strong)]'}`} aria-hidden>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#fff] shadow transition-transform duration-200 ${formData.trackStock ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                      </span>
                      Controlar stock
                    </button>
                  </div>
                  <input
                    id="stock"
                    required={formData.trackStock}
                    disabled={!formData.trackStock}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={formUnit.step}
                    value={formData.trackStock ? formData.stock : ''}
                    placeholder={formData.trackStock ? '0' : 'Servicio o producto sin inventario'}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="mv-input mv-data disabled:opacity-60 placeholder:font-sans placeholder:text-sm"
                  />
                </div>
                {formData.trackStock && (
                  <div className="space-y-2">
                    <label htmlFor="minStock" className={fieldLabel}>Avisar con stock bajo en <span className={hint}>opcional{formUnit.id !== 'UNIT' ? `, en ${formUnit.short}` : ''}</span></label>
                    <input
                      id="minStock"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={formUnit.step}
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      placeholder="Sin aviso"
                      aria-describedby="minStock-hint"
                      className="mv-input mv-data placeholder:font-sans placeholder:text-sm"
                    />
                    <p id="minStock-hint" className="text-xs text-[var(--text-secondary)]">Cuando quede esa cantidad o menos, se marca “Stock bajo” en la caja y en reportes.</p>
                  </div>
                )}
                {(config?.kosherPlaceId || business.dietary || formData.kosherCategory) && (
                  <div className="space-y-2">
                    <label htmlFor="kosherCategory" className={fieldLabel}>Categoría en Mercav Kosher <span className={hint}>opcional</span></label>
                    <select
                      id="kosherCategory"
                      value={formData.kosherCategory}
                      onChange={(e) => setFormData({ ...formData, kosherCategory: e.target.value })}
                      className="mv-input"
                    >
                      <option value="">No publicar</option>
                      {KOSHER_STOCK_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="sku" className={fieldLabel}>SKU o código interno <span className={hint}>opcional</span></label>
                  <input
                    id="sku"
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    autoComplete="off"
                    className="mv-input mv-data"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="barcode" className={fieldLabel}>Código de barras <span className={hint}>opcional</span></label>
                  <input
                    id="barcode"
                    type="text"
                    inputMode="numeric"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Escaneá o escribí el código"
                    autoComplete="off"
                    className="mv-input mv-data placeholder:font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="taxRate" className={fieldLabel}>{config?.taxName || 'IVA'} propio (%) <span className={hint}>opcional</span></label>
                  <input
                    id="taxRate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    placeholder={`Usa la tasa general: ${Number(config?.taxRate ?? 0)}%`}
                    className="mv-input mv-data placeholder:font-sans placeholder:text-sm"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="p-image" className={fieldLabel}>Imagen <span className={hint}>JPG o PNG, hasta 5 MB</span></label>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <ImageIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} aria-hidden />
                      <input
                        id="p-image"
                        type="text"
                        inputMode="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="Pegá una URL o subí un archivo"
                        className="mv-input pl-11 pr-24 text-sm"
                      />
                      <label className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[0.625rem] border border-[var(--mv-hairline-strong)] px-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--color-border-gold)] focus-within:ring-2 focus-within:ring-[color:var(--color-gold)]">
                        {uploading ? <Loader2 size={14} className="animate-spin" aria-label="Subiendo imagen" /> : 'Subir'}
                        <input type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleFileUpload} disabled={uploading} aria-label="Subir imagen desde un archivo" />
                      </label>
                    </div>
                    {formData.imageUrl && (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.875rem] border border-[var(--mv-hairline-strong)]">
                        <img src={formData.imageUrl} alt="Vista previa de la imagen" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {showDietary && (
                  <fieldset className="space-y-2 md:col-span-2">
                    <legend className={`${fieldLabel} mb-2`}>Etiquetas dietarias</legend>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        { id: 'isKosher', label: 'Kosher', icon: ShieldCheck },
                        { id: 'isHalal', label: 'Halal', icon: Heart },
                        { id: 'isVegan', label: 'Vegano', icon: Leaf },
                        { id: 'isGlutenFree', label: 'Sin TACC', icon: Check },
                      ].map((diet) => {
                        const on = Boolean(formData[diet.id as keyof typeof formData]);
                        return (
                          <button
                            key={diet.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleDiet(diet.id)}
                            className={`mv-focus flex h-12 items-center gap-2 rounded-[0.875rem] border px-3 text-sm font-semibold transition-colors duration-150 ${on ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold' : 'border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                          >
                            <diet.icon size={16} aria-hidden />
                            {diet.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Marcá solo lo que respalda la certificación del producto. Mercav no certifica ni emite hechsher.</p>
                  </fieldset>
                )}

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="p-description" className={fieldLabel}>Descripción <span className={hint}>opcional</span></label>
                  <textarea
                    id="p-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mv-input h-24 resize-none py-3"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--mv-hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className="mv-focus inline-flex h-12 items-center gap-3 rounded-full px-2 text-sm font-semibold text-[var(--text-primary)]"
                >
                  {formData.isActive ? <ToggleRight size={26} className="text-green-400" aria-hidden /> : <ToggleLeft size={26} className="text-[var(--text-tertiary)]" aria-hidden />}
                  {formData.isActive ? 'Visible en la caja' : 'Oculto en la caja'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="mv-btn mv-btn-primary mv-btn-lg w-full sm:w-auto"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}
                  {editingProductId ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
          <div className="mv-fade absolute inset-0 bg-black/50" onClick={() => setShowCategoryModal(false)} aria-hidden />
          <div className="mv-pop mv-menu custom-scrollbar relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-[1.75rem] p-5 sm:p-8">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 id="category-modal-title" className="mv-h3">Categorías</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Creá las tuyas o sumá las sugeridas para un rubro.</p>
              </div>
              <button type="button" onClick={() => setShowCategoryModal(false)} aria-label="Cerrar" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                <X size={20} aria-hidden />
              </button>
            </header>
            
            <div className="mt-6 space-y-6">
              <form onSubmit={handleCreateCategory} className="space-y-2">
                <label htmlFor="cat-name" className={fieldLabel}>Nueva categoría</label>
                <div className="flex gap-2">
                  <input
                    id="cat-name"
                    autoFocus
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder={`Ej: ${business.categoryPresets.slice(0, 2).join(', ') || 'Destacados'}`}
                    autoComplete="off"
                    className="mv-input min-w-0 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!catName || submitting}
                    aria-label="Crear categoría"
                    className="mv-btn mv-btn-primary shrink-0 px-4"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5" aria-hidden /> : <Plus size={20} aria-hidden />}
                    <span className="hidden sm:inline">Crear</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className={fieldLabel} id="presets-label">Sugeridas por rubro</p>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-gold" aria-label="Creando categorías" />}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-labelledby="presets-label">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAddPreset(preset.categoryPresets.filter((n) => !categories.some((c) => c.name === n)))}
                      disabled={submitting}
                      className={`mv-focus rounded-2xl border p-4 text-left transition-colors duration-150 disabled:opacity-50 ${preset.id === business.id ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]' : 'border-[var(--mv-hairline-strong)] hover:border-[var(--color-border-gold)]'}`}
                    >
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {preset.name}{preset.id === business.id && <span className="font-medium text-gold"> · tu rubro</span>}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-secondary)]">{preset.categoryPresets.join(', ')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className={`${plainBtn} w-full`}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {pinDialog}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar este producto?"
        message="Si tiene ventas registradas lo archivamos para conservar el historial. Si no, se elimina y no se puede deshacer."
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
