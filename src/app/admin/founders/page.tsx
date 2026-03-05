'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react'

type FoundersPass = {
  id: string
  pass_number: number
  email: string
  full_name: string
  payment_method: 'paypal' | 'venmo' | 'stripe' | 'other'
  payment_id: string | null
  amount_paid: number
  discount_code: string | null
  status: 'reserved' | 'paid' | 'active' | 'cancelled'
  plaque_name: string
  merch_size: string | null
  shipping_address: string | null
  notes: string | null
  purchased_at: string
  activated_at: string | null
}

export default function AdminFoundersPage() {
  const [passes, setPasses] = useState<FoundersPass[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'reserved' | 'paid' | 'active' | 'cancelled'>('all')
  const [selectedPass, setSelectedPass] = useState<FoundersPass | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPasses()
  }, [filter])

  const fetchPasses = async () => {
    setLoading(true)
    let query = supabase
      .from('founders_passes')
      .select('*')
      .order('pass_number', { ascending: true })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (!error && data) {
      setPasses(data)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: FoundersPass['status']) => {
    const updateData: any = { status: newStatus }
    
    if (newStatus === 'active' && !passes.find(p => p.id === id)?.activated_at) {
      updateData.activated_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('founders_passes')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      fetchPasses()
      setSelectedPass(null)
    }
  }

  const totalRevenue = passes
    .filter(p => p.status === 'paid' || p.status === 'active')
    .reduce((sum, p) => sum + p.amount_paid, 0)

  const stats = {
    total: passes.length,
    reserved: passes.filter(p => p.status === 'reserved').length,
    paid: passes.filter(p => p.status === 'paid').length,
    active: passes.filter(p => p.status === 'active').length,
    cancelled: passes.filter(p => p.status === 'cancelled').length,
    revenue: totalRevenue,
  }

  const FilterButton = ({ value, label, count }: { value: typeof filter; label: string; count: number }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 font-display tracking-wide transition-all ${
        filter === value
          ? 'bg-kraken-cyan text-kraken-dark'
          : 'bg-kraken-card text-gray-400 hover:text-white'
      }`}
    >
      {label} ({count})
    </button>
  )

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-2">
          FOUNDERS PASS MANAGEMENT
        </h2>
        <p className="text-gray-300">Track and manage founder pass holders (Limited to 50)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <Users className="text-kraken-cyan mb-2" size={32} />
          <p className="text-3xl font-display text-white">{stats.total}/50</p>
          <p className="text-gray-400 text-sm">Total Passes</p>
        </div>
        <div className="card">
          <CheckCircle className="text-green-400 mb-2" size={32} />
          <p className="text-3xl font-display text-white">{stats.active}</p>
          <p className="text-gray-400 text-sm">Active</p>
        </div>
        <div className="card">
          <DollarSign className="text-kraken-pink mb-2" size={32} />
          <p className="text-3xl font-display text-white">{stats.paid}</p>
          <p className="text-gray-400 text-sm">Paid</p>
        </div>
        <div className="card">
          <Package className="text-purple-400 mb-2" size={32} />
          <p className="text-3xl font-display text-kraken-pink">${stats.revenue.toFixed(2)}</p>
          <p className="text-gray-400 text-sm">Total Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterButton value="all" label="ALL" count={stats.total} />
        <FilterButton value="reserved" label="RESERVED" count={stats.reserved} />
        <FilterButton value="paid" label="PAID" count={stats.paid} />
        <FilterButton value="active" label="ACTIVE" count={stats.active} />
        <FilterButton value="cancelled" label="CANCELLED" count={stats.cancelled} />
      </div>

      {/* Passes List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : passes.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">No {filter === 'all' ? '' : filter} passes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {passes.map((pass) => (
            <div key={pass.id} className="card hover:border-kraken-cyan transition-all">
              <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl font-display text-kraken-cyan">#{pass.pass_number}</span>
                    <div>
                      <h3 className="text-xl font-display text-white">{pass.full_name}</h3>
                      <p className="text-gray-400 text-sm">{pass.email}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-display ml-auto ${
                      pass.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-400' :
                      pass.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                      pass.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {pass.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Plaque Name</p>
                      <p className="text-white font-display">{pass.plaque_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Payment</p>
                      <p className="text-white">
                        ${pass.amount_paid.toFixed(2)} via {pass.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Purchased</p>
                      <p className="text-white">{new Date(pass.purchased_at).toLocaleDateString()}</p>
                    </div>
                    {pass.merch_size && (
                      <div>
                        <p className="text-gray-400">Merch Size</p>
                        <p className="text-white">{pass.merch_size}</p>
                      </div>
                    )}
                    {pass.discount_code && (
                      <div>
                        <p className="text-gray-400">Discount Code</p>
                        <p className="text-kraken-pink">{pass.discount_code}</p>
                      </div>
                    )}
                    {pass.activated_at && (
                      <div>
                        <p className="text-gray-400">Activated</p>
                        <p className="text-green-400">{new Date(pass.activated_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {pass.shipping_address && (
                    <div className="mt-3 p-2 bg-kraken-card rounded">
                      <p className="text-gray-400 text-xs">Shipping Address:</p>
                      <p className="text-white text-sm">{pass.shipping_address}</p>
                    </div>
                  )}

                  {pass.notes && (
                    <div className="mt-3 p-2 bg-kraken-card rounded">
                      <p className="text-gray-400 text-xs">Notes:</p>
                      <p className="text-white text-sm">{pass.notes}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 w-full lg:w-auto lg:ml-4">
                  <button
                    onClick={() => setSelectedPass(pass)}
                    className="btn-secondary text-sm py-2 px-4 flex items-center justify-center"
                  >
                    DETAILS
                  </button>
                  
                  {pass.status !== 'active' && (
                    <button
                      onClick={() => updateStatus(pass.id, 'active')}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 text-sm font-display transition-colors flex items-center justify-center"
                    >
                      ACTIVATE
                    </button>
                  )}
                  
                  {pass.status === 'reserved' && (
                    <button
                      onClick={() => updateStatus(pass.id, 'paid')}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 text-sm font-display transition-colors flex items-center justify-center"
                    >
                      MARK PAID
                    </button>
                  )}
                  
                  {pass.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this pass?')) {
                          updateStatus(pass.id, 'cancelled')
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 text-sm font-display transition-colors flex items-center justify-center"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPass && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPass(null)}
        >
          <div
            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-display text-kraken-cyan">PASS #{selectedPass.pass_number}</h3>
                <p className="text-gray-400">{selectedPass.full_name}</p>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1">Full Name</p>
                  <p className="text-white">{selectedPass.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Email</p>
                  <p className="text-white">{selectedPass.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Plaque Name</p>
                  <p className="text-white font-display text-xl">{selectedPass.plaque_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <span className={`px-3 py-1 text-xs font-display inline-block ${
                    selectedPass.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedPass.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                    selectedPass.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedPass.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Amount Paid</p>
                  <p className="text-kraken-pink text-xl">${selectedPass.amount_paid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Payment Method</p>
                  <p className="text-white">{selectedPass.payment_method.toUpperCase()}</p>
                </div>
                {selectedPass.payment_id && (
                  <div>
                    <p className="text-gray-400 mb-1">Payment ID</p>
                    <p className="text-white font-mono text-sm">{selectedPass.payment_id}</p>
                  </div>
                )}
                {selectedPass.discount_code && (
                  <div>
                    <p className="text-gray-400 mb-1">Discount Code Used</p>
                    <p className="text-kraken-cyan">{selectedPass.discount_code}</p>
                  </div>
                )}
                {selectedPass.merch_size && (
                  <div>
                    <p className="text-gray-400 mb-1">Merch Size</p>
                    <p className="text-white">{selectedPass.merch_size}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 mb-1">Purchased At</p>
                  <p className="text-white">{new Date(selectedPass.purchased_at).toLocaleString()}</p>
                </div>
                {selectedPass.activated_at && (
                  <div>
                    <p className="text-gray-400 mb-1">Activated At</p>
                    <p className="text-green-400">{new Date(selectedPass.activated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedPass.shipping_address && (
                <div>
                  <p className="text-gray-400 mb-2">Shipping Address</p>
                  <div className="p-3 bg-kraken-card rounded">
                    <p className="text-white whitespace-pre-line">{selectedPass.shipping_address}</p>
                  </div>
                </div>
              )}

              {selectedPass.notes && (
                <div>
                  <p className="text-gray-400 mb-2">Notes</p>
                  <div className="p-3 bg-kraken-card rounded">
                    <p className="text-white whitespace-pre-line">{selectedPass.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {selectedPass.status !== 'active' && (
                  <button
                    onClick={() => updateStatus(selectedPass.id, 'active')}
                    className="btn-primary flex-1"
                  >
                    ACTIVATE PASS
                  </button>
                )}
                {selectedPass.status === 'reserved' && (
                  <button
                    onClick={() => updateStatus(selectedPass.id, 'paid')}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 flex-1 font-display transition-colors"
                  >
                    MARK AS PAID
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
