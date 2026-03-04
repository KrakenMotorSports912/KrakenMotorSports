'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Tag, Percent, DollarSign } from 'lucide-react'

type Discount = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  min_purchase: number
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  applies_to: string[]
  created_at: string
}

type DiscountUpdate = Omit<Discount, 'id' | 'created_at' | 'current_uses'>
type DiscountFormData = {
  code: string
  description: string
  discount_type: Discount['discount_type']
  discount_value: number
  min_purchase: number
  max_uses: number | null
  valid_from: string
  valid_until: string
  is_active: boolean
  applies_to: string[]
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_uses: null,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    is_active: true,
    applies_to: ['session', 'founders_pass', 'merchandise'],
  })

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const fetchDiscounts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDiscounts(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()

    const submitData: DiscountUpdate = {
      code: formData.code.toUpperCase(),
      description: formData.description,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_purchase: formData.min_purchase,
      max_uses: formData.max_uses || null,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
      applies_to: formData.applies_to,
    }

    if (editingDiscount) {
      const { error } = await supabase
        .from('discounts')
        .update(submitData)
        .eq('id', editingDiscount.id)

      if (!error) {
        fetchDiscounts()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('discounts')
        .insert({
          ...submitData,
          created_by: user?.id,
        })

      if (!error) {
        fetchDiscounts()
        resetForm()
      }
    }
  }

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      description: discount.description || '',
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      min_purchase: discount.min_purchase,
      max_uses: discount.max_uses,
      valid_from: discount.valid_from.slice(0, 16),
      valid_until: discount.valid_until ? discount.valid_until.slice(0, 16) : '',
      is_active: discount.is_active,
      applies_to: discount.applies_to,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this discount code?')) {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchDiscounts()
      }
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('discounts')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchDiscounts()
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: null,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
      is_active: true,
      applies_to: ['session', 'founders_pass', 'merchandise'],
    })
    setEditingDiscount(null)
    setShowForm(false)
  }

  const handleAppliesToggle = (value: string) => {
    if (formData.applies_to.includes(value)) {
      setFormData({
        ...formData,
        applies_to: formData.applies_to.filter(item => item !== value)
      })
    } else {
      setFormData({
        ...formData,
        applies_to: [...formData.applies_to, value]
      })
    }
  }

  return (
    <section>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-2">
            DISCOUNT MANAGEMENT
          </h2>
          <p className="text-gray-300">Create and manage promotional discount codes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {showForm ? 'CANCEL' : 'NEW DISCOUNT'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-2xl font-display text-kraken-cyan mb-4">
            {editingDiscount ? 'EDIT DISCOUNT' : 'CREATE NEW DISCOUNT'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-kraken-cyan mb-2 font-display">CODE *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="input-field uppercase"
                  placeholder="SUMMER2026"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">DISCOUNT TYPE *</label>
                <select
                  required
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">
                  DISCOUNT VALUE * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">MIN PURCHASE ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">MAX USES</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  className="input-field"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">VALID FROM *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">VALID UNTIL</label>
                <input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="input-field"
                  placeholder="No expiry"
                />
              </div>
            </div>

            <div>
              <label className="block text-kraken-cyan mb-2 font-display">DESCRIPTION</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Summer sale discount code"
              />
            </div>

            <div>
              <label className="block text-kraken-cyan mb-2 font-display">APPLIES TO</label>
              <div className="flex flex-wrap gap-3">
                {['session', 'founders_pass', 'merchandise'].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.applies_to.includes(item)}
                      onChange={() => handleAppliesToggle(item)}
                      className="w-5 h-5"
                    />
                    <span>{item.replace('_', ' ').toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="is_active" className="text-white">Active (can be used)</label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                {editingDiscount ? 'UPDATE DISCOUNT' : 'CREATE DISCOUNT'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : discounts.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">No discount codes created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-display font-mono text-kraken-cyan">{discount.code}</h3>
                    <span className={`px-3 py-1 text-xs font-display ${
                      discount.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {discount.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {discount.description && (
                    <p className="text-gray-300 mb-3">{discount.description}</p>
                  )}

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Discount</p>
                      <p className="text-white font-display text-xl text-kraken-pink">
                        {discount.discount_type === 'percentage' ? (
                          <>{discount.discount_value}%</>
                        ) : (
                          <>${discount.discount_value.toFixed(2)}</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Min Purchase</p>
                      <p className="text-white">${discount.min_purchase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Usage</p>
                      <p className="text-white">
                        {discount.current_uses} / {discount.max_uses ? discount.max_uses : '∞'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Valid Until</p>
                      <p className="text-white">
                        {discount.valid_until ? new Date(discount.valid_until).toLocaleDateString() : 'No expiry'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-400 text-xs">Applies to:</p>
                    <div className="flex gap-2 mt-1">
                      {discount.applies_to.map((item) => (
                        <span key={item} className="px-2 py-1 text-xs bg-kraken-cyan/20 text-kraken-cyan">
                          {item.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(discount)}
                    className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    EDIT
                  </button>
                  <button
                    onClick={() => toggleActive(discount.id, discount.is_active)}
                    className={`text-sm py-2 px-4 font-display transition-colors ${
                      discount.is_active
                        ? 'bg-gray-500 hover:bg-gray-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {discount.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 font-display flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
