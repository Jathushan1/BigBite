import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Utensils, ShieldCheck, Zap, Award, Sparkles, Heart } from 'lucide-react'
import { Logo } from '../components/Logo'

export const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-[#E4002B] selection:text-white">
      {/* Top Welcome Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="group transition-transform hover:scale-[1.02]">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-[#E4002B] transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full bg-[#E4002B] hover:bg-[#C40024] text-white font-extrabold text-sm shadow-md shadow-red-600/20 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-20 lg:py-28">
        {/* Background Image with Dark Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=80"
            alt="Delicious artisan pizza with melting cheese and fresh toppings"
            className="w-full h-full object-cover object-center opacity-35 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E4002B]/20 border border-[#E4002B]/40 text-[#FF2B4F] text-xs font-black uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Slice, Slice, Baby!</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
              Don't play <span className="text-[#E4002B] underline decoration-[#FF2B4F]/40 underline-offset-4">ketchup</span> with your hunger.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-300 font-medium leading-relaxed">
              Crave the crunch. Savor the sauce. BigBite brings handcrafted, piping-hot pizzas and crispy sides straight to your doorstep in 30 minutes flat.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#E4002B] hover:bg-[#C40024] text-white text-base font-black tracking-wide shadow-xl shadow-red-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Order Now</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-base font-bold backdrop-blur-md border border-white/20 transition cursor-pointer"
              >
                <span>Create Account</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs font-semibold text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#FF2B4F]" />
                <span>30-Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF2B4F]" />
                <span>100% Quality Ingredients</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#FF2B4F]" />
                <span>50,000+ Happy Foodies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playful Food Pun Banner */}
      <section className="bg-[#E4002B] text-white py-4 px-4 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-center">
          <span>🍕 Freshly Baked Every 15 Minutes</span>
          <span className="hidden md:inline">•</span>
          <span>🧀 Real Mozzarella Pulls</span>
          <span className="hidden md:inline">•</span>
          <span>🔥 Use Code "WELCOME10" For 10% Off</span>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#E4002B] text-xs font-black uppercase tracking-wider">The BigBite Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight mt-1">
              Why Sri Lanka Chooses BigBite
            </h2>
            <p className="text-neutral-600 text-sm sm:text-base mt-3">
              No half-baked cravings. From our signature stone-crust recipe to contactless delivery across Colombo and Kandy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center mb-6">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 mb-2">Hand-Tossed Daily</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Made from premium flour and fermented for 24 hours to give you that golden, cloud-soft interior and satisfying crunchy rim.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 mb-2">Piping Hot Delivery</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Insulated thermal delivery packs keep your pizza bubbling and crisp from our ovens straight to your dining table.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 mb-2">Local Flavors & Deals</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Specially tailored menu items with real fiery spices, BBQ chicken, and everyday pocket-friendly combo promos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Ready to Take Your First <span className="text-[#E4002B]">BigBite</span>?
          </h2>
          <p className="text-neutral-600 text-base max-w-xl mx-auto">
            Sign in or create your free account now to select your branch and order your favorite slice in seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E4002B] hover:bg-[#C40024] text-white text-base font-black shadow-lg shadow-red-600/20 transition active:scale-95"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-neutral-900 text-neutral-400 text-xs py-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo lightText={true} />
          <p className="text-neutral-500">
            © {new Date().getFullYear()} BigBite Food Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
