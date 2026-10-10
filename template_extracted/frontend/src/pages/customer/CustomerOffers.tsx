import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  Tag,
  ArrowUpDown,
  Compass,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDemo } from '@/context/DemoContext'
import { ApiClient } from '@/api/client'
import type { PersonalizedOffer } from '@/types'
import { PersonalizedOfferCard } from '@/components/offers/PersonalizedOfferCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export const CustomerOffers: React.FC = () => {
  const { user } = useAuth()
  const { locality } = useDemo()

  const [offers, setOffers] = useState<PersonalizedOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'best_match' | 'nearby' | 'highest_savings' | 'expiring_soon'>('best_match')

  const fetchOffers = async () => {
    setIsLoading(true)
    try {
      const data = await ApiClient.getPersonalizedOffers({
        customerId: user?.id || 'c_001',
        locality,
        category: selectedCategory,
        sortBy,
      })
      setOffers(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [locality, selectedCategory, sortBy, user?.id])

  // Client-side text filter on title or merchant
  const filteredOffers = offers.filter((o) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      o.merchant_name.toLowerCase().includes(q) ||
      o.item_title.toLowerCase().includes(q) ||
      o.reason.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-7 h-7 text-teal-600" />
            Personalized Offers Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time algorithmic discount decisions active for you in <strong className="text-slate-800">{locality}</strong>.
          </p>
        </div>

        <Badge variant="teal" className="self-start sm:self-auto py-1 px-3">
          {filteredOffers.length} Eligible Offers
        </Badge>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by cafe, restaurant, dish, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="best_match">Sort by: ML Best Match (E[Profit])</option>
              <option value="nearby">Sort by: Nearest (Walking Time)</option>
              <option value="highest_savings">Sort by: Highest Savings (₹)</option>
              <option value="expiring_soon">Sort by: Expiring Soon</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'cafe', 'bakery', 'restaurant'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-88 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 animate-pulse">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <PersonalizedOfferCard
              key={offer.id}
              offer={offer}
              onSaveToggle={fetchOffers}
              onDismiss={fetchOffers}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No offers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Categories", or switching your active locality.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSortBy('best_match')
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
