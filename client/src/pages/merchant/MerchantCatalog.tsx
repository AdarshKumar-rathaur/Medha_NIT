import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  PackageSearch,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiClient } from '@/api/client'
import type { CatalogItem } from '@/types'
import { formatINR } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Skeleton } from '@/components/ui/Skeleton'

const itemSchema = z
  .object({
    title: z.string().min(2, 'Item title must be at least 2 characters'),
    category: z.string().min(2, 'Category required'),
    price_inr: z.coerce.number().min(10, 'Price must be at least ₹10'),
    unit_cost_inr: z.coerce.number().min(1, 'Unit cost must be at least ₹1'),
    stock_units: z.coerce.number().min(0, 'Stock cannot be negative'),
    prep_minutes: z.coerce.number().min(1, 'Prep time must be at least 1 min'),
    is_veg: z.boolean(),
    description: z.string().optional(),
    tags: z.string().optional(),
  })
  .refine((data) => data.price_inr >= data.unit_cost_inr, {
    message: 'Selling price cannot be lower than unit cost (loss-making item)',
    path: ['price_inr'],
  })

type ItemFormValues = z.infer<typeof itemSchema>

export const MerchantCatalog: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()

  const [items, setItems] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  })

  const isVeg = watch('is_veg')
  const watchPrice = watch('price_inr')
  const watchCost = watch('unit_cost_inr')

  const grossMargin =
    watchPrice && watchCost && watchPrice > watchCost
      ? (((watchPrice - watchCost) / watchPrice) * 100).toFixed(1)
      : '0'

  const fetchCatalog = async () => {
    setIsLoading(true)
    try {
      const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
      const data = await ApiClient.getCatalog(mid)
      setItems(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [user?.id])

  const handleOpenAdd = () => {
    setEditingItem(null)
    reset({
      title: '',
      category: 'lunch',
      price_inr: 150,
      unit_cost_inr: 40,
      stock_units: 15,
      prep_minutes: 8,
      is_veg: true,
      description: '',
      tags: 'lunch, vegetarian',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item)
    reset({
      title: item.title,
      category: item.category,
      price_inr: item.price_inr,
      unit_cost_inr: item.unit_cost_inr,
      stock_units: item.stock_units,
      prep_minutes: item.prep_minutes,
      is_veg: item.is_veg,
      description: item.description || '',
      tags: item.tags?.join(', ') || '',
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (values: ItemFormValues) => {
    const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
    try {
      if (editingItem) {
        await ApiClient.updateCatalogItem(mid, editingItem.id, {
          title: values.title,
          category: values.category,
          price_inr: values.price_inr,
          unit_cost_inr: values.unit_cost_inr,
          stock_units: values.stock_units,
          prep_minutes: values.prep_minutes,
          is_veg: values.is_veg,
          description: values.description,
          tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
        })
        success(`Updated ${values.title}`)
      } else {
        await ApiClient.addCatalogItem(mid, {
          title: values.title,
          category: values.category,
          price_inr: values.price_inr,
          unit_cost_inr: values.unit_cost_inr,
          stock_units: values.stock_units,
          prep_minutes: values.prep_minutes,
          is_veg: values.is_veg,
          description: values.description,
          tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
          is_active: true,
        })
        success(`Added ${values.title} to catalog`)
      }
      setIsModalOpen(false)
      fetchCatalog()
    } catch (err: any) {
      error(err.message || 'Failed to save item')
    }
  }

  const handleDelete = async (itemId: string, title: string) => {
    if (!window.confirm(`Delete ${title} from catalog?`)) return
    const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
    try {
      await ApiClient.deleteCatalogItem(mid, itemId)
      success(`Removed ${title}`)
      fetchCatalog()
    } catch {
      error('Failed to delete item')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-indigo-600" />
            Catalog & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain menu prices, unit costs, stock units, and preparation times used for ML decisioning.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-1.5 self-start sm:self-auto text-xs">
          <Plus className="w-4 h-4" /> Add Catalog Item
        </Button>
      </div>

      {/* Catalog Table */}
      <Card className="p-6 border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Item Title</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Selling Price</th>
                  <th className="py-3 px-2">Unit Cost</th>
                  <th className="py-3 px-2">Gross Margin</th>
                  <th className="py-3 px-2">Stock</th>
                  <th className="py-3 px-2">Prep Time</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item) => {
                  const marginPct = (((item.price_inr - item.unit_cost_inr) / item.price_inr) * 100).toFixed(0)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <PackageSearch className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{item.title}</span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {item.description || item.tags?.join(', ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 capitalize">{item.category}</td>

                      <td className="py-3 px-2 font-bold font-mono text-slate-900">
                        {formatINR(item.price_inr)}
                      </td>

                      <td className="py-3 px-2 font-mono text-slate-500">
                        {formatINR(item.unit_cost_inr)}
                      </td>

                      <td className="py-3 px-2 font-mono font-semibold text-teal-700">
                        {marginPct}% ({formatINR(item.price_inr - item.unit_cost_inr)})
                      </td>

                      <td className="py-3 px-2">
                        <Badge
                          variant={item.stock_units > 10 ? 'success' : item.stock_units > 0 ? 'warning' : 'destructive'}
                          className="text-[10px]"
                        >
                          {item.stock_units} units
                        </Badge>
                      </td>

                      <td className="py-3 px-2 text-slate-600">{item.prep_minutes} mins</td>

                      <td className="py-3 px-2">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                        />
                      </td>

                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 w-7 p-0"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">No catalog items configured.</div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit: ${editingItem.title}` : 'Add Catalog Item'}
        description="Configure unit economics. Ensure selling price exceeds unit cost to protect baseline margins."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Input label="Item Title" placeholder="e.g. Cold Brew Coffee" {...register('title')} error={errors.title?.message} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Category" placeholder="drink, lunch, snack" {...register('category')} error={errors.category?.message} />
            <Input label="Preparation Time (Mins)" type="number" {...register('prep_minutes')} error={errors.prep_minutes?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Base Selling Price (₹ INR)" type="number" step="0.5" {...register('price_inr')} error={errors.price_inr?.message} />
            <Input label="Merchant Unit Cost (₹ INR)" type="number" step="0.5" {...register('unit_cost_inr')} error={errors.unit_cost_inr?.message} />
          </div>

          {/* Live Gross Margin Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600">Calculated Baseline Margin:</span>
            <span className="font-bold text-teal-800">{grossMargin}% gross margin</span>
          </div>

          <Input label="Stock / Inventory Units" type="number" {...register('stock_units')} error={errors.stock_units?.message} />

          <Input label="Tags (Comma separated)" placeholder="lunch, cold, vegetarian" {...register('tags')} />

          <div className="pt-1">
            <Switch
              checked={isVeg}
              onChange={(val) => setValue('is_veg', val)}
              label="Vegetarian Item"
              description="Tagged for customer dietary constraint filtering."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
