import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Store,
  Compass,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Percent,
  Sliders,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatINR, formatPercent } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'

export const LandingPage: React.FC = () => {
  const { switchDemoRole } = useAuth()

  // Interactive Live ML Simulation State on Landing Page
  const [interactiveDiscount, setInteractiveDiscount] = useState<number>(10)

  // Simulation parameters based on Priya's Tuesday at Little Fern Café
  const basePrice = 150
  const unitCost = 32.29
  const discountAmount = (basePrice * interactiveDiscount) / 100
  const finalPrice = basePrice - discountAmount
  const margin = finalPrice - unitCost

  // Calibrated acceptance curve simulation
  const calculatePAccept = (d: number) => {
    if (d === 0) return 0.4447
    if (d <= 5) return 0.4482
    if (d <= 10) return 0.6838
    if (d <= 15) return 0.7338
    return 0.7508
  }

  const pAccept = calculatePAccept(interactiveDiscount)
  const expectedProfit = pAccept * margin

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Machine Learning Decision Engine for Local Commerce</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Smarter Offers.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 bg-clip-text text-transparent">
                Better Conversions.
              </span>{' '}
              Healthier Margins.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              AI-powered local offers that match customer preferences while helping merchants optimize expected contribution profit.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/customer/dashboard"
                onClick={() => switchDemoRole('customer')}
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto text-base h-13 px-8 shadow-md gap-2">
                  <span>Explore Personalized Offers</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link
                to="/merchant/dashboard"
                onClick={() => switchDemoRole('merchant')}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base h-13 px-8 bg-white border-slate-300 text-slate-800 hover:bg-slate-50 gap-2"
                >
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>I'm a Merchant</span>
                </Button>
              </Link>
            </div>

            <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> No generic mass coupons
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Strict margin floor protection
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Grounded Hindi/English copy
              </span>
            </div>
          </div>

          {/* Product Preview Card (Hero Showcase: Priya at Little Fern Café) */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-300/80 bg-white shadow-2xl p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    P
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Live Pipeline Preview: Priya's Tuesday Lunch
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tuesday 1:15 PM • Koramangala • 33°C Sunny • 20 min break • ₹400 wallet
                    </p>
                  </div>
                </div>

                <Badge variant="teal" className="text-xs py-1 px-3">
                  E[Profit] Optimized Decision
                </Badge>
              </div>

              {/* Offer Card Preview Box */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        Personalized Offer
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                        Little Fern Café
                      </h4>
                      <p className="text-xs text-slate-500">Iced Coffee & Fresh Lunch Bowl</p>
                    </div>
                    <Badge variant="teal" className="text-sm font-extrabold">
                      {interactiveDiscount}% OFF
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {formatINR(finalPrice)}
                    </span>
                    <span className="text-sm line-through text-slate-400">
                      {formatINR(basePrice)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      You save {formatINR(discountAmount)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" /> 137m (2 min walk)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> Valid for 20 mins
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 italic">
                    "Little Fern Café par Iced coffee & lunch bowl ke saath lunch enjoy karein at {formatINR(finalPrice)}. Sirf 2 min walk door!"
                  </div>
                </div>

                {/* Right: Live Interactive ML Slider & Economics */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        Simulate Discount Depth
                      </span>
                      <span className="font-mono text-sm font-bold text-indigo-900">
                        {interactiveDiscount}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="5"
                      value={interactiveDiscount}
                      onChange={(e) => setInteractiveDiscount(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0%</span>
                      <span>5%</span>
                      <span className="font-bold text-teal-700">10% (Opt)</span>
                      <span>15%</span>
                      <span>20% (Max)</span>
                    </div>
                  </div>

                  {/* Math Breakdown Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">P(Accept) ML</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatPercent(pAccept, true)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Post Margin</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatINR(margin)}
                      </span>
                    </div>
                    <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-teal-900 block uppercase">
                          Expected Profit E[P]
                        </span>
                        <span className="text-base font-extrabold text-teal-950">
                          {formatINR(expectedProfit)}
                        </span>
                      </div>
                      {interactiveDiscount === 10 ? (
                        <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">
                          ★ OPTIMAL
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Suboptimal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Value Propositions */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Value Propositions
            </h2>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              Transforming Coupons Into Commercial Intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 border-slate-200 hover:border-indigo-300">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                1. Contextually Relevant Customer Offers
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Offers match user break times, physical walking distance, meal preferences, and current weather—delivering timely discounts when customers are ready to order.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 hover:border-indigo-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-4">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                2. Smarter Discount Decisions
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Stop giving away excessive margin. Our XGBoost model determines the exact discount depth needed to convert rather than defaulting to maximum margins.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 hover:border-indigo-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                3. Profit-Aware Merchant Recommendations
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Guaranteed margin floor checks and inventory awareness. Merchants approve or pause campaigns while monitoring expected versus realized profit curves.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              End-to-End Decision Pipeline
            </h2>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              How the Decision Engine Evaluates Every Moment
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <div className="text-2xl font-black text-slate-300 mb-3 font-mono">01</div>
              <h4 className="text-base font-bold text-slate-900">Understand Context</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Ingests customer coordinates, available break time, wallet balance, merchant open hours, occupancy, and 33°C weather.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <div className="text-2xl font-black text-slate-300 mb-3 font-mono">02</div>
              <h4 className="text-base font-bold text-slate-900">Predict Acceptance</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Extracts 55 features and runs calibrated XGBoost inference to estimate customer acceptance probability P(Accept) between 0 and 1.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <div className="text-2xl font-black text-slate-300 mb-3 font-mono">03</div>
              <h4 className="text-base font-bold text-slate-900">Optimize Profit</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Searches discrete discount depths to maximize Expected Profit = P(Accept) × Post-Discount Margin while checking min margin floor.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <div className="text-2xl font-black text-slate-300 mb-3 font-mono">04</div>
              <h4 className="text-base font-bold text-slate-900">Deliver Offers</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Generates grounded, localized notification and email payloads in Hinglish, Kannada, or English with strict verification codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Statistical Notice Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 text-left sm:text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold text-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Statistical Estimation & Accuracy Notice</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              All profit indicators in this platform represent statistical <em>expected contribution profit</em> derived from machine learning probability distributions. Predictions are probabilistic models and never guarantee real profit outcomes, which ultimately depend on individual customer redemption behavior and live store execution.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
