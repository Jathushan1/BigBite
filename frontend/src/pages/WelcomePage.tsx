import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Utensils, ShieldCheck, Zap, Award, Sparkles, Heart } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

export const WelcomePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-20 lg:py-28">
        {/* Background Image with Dark Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=80"
            alt="Delicious artisan pizza with melting cheese and fresh toppings"
            className="w-full h-full object-cover object-center opacity-30 scale-105 transition-transform duration-1000 ease-out motion-reduce:transform-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Deliberate motion moment on load */}
          <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 motion-reduce:animate-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-accent text-xs font-black uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Slice, Slice, Baby!</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
              Don't play <span className="text-primary underline decoration-accent/40 underline-offset-4">ketchup</span> with your hunger.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-300 font-medium leading-relaxed">
              Crave the crunch. Savor the sauce. BigBite brings handcrafted, piping-hot pizzas and crispy sides straight to your doorstep in 30 minutes flat.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link to={user ? '/order' : '/login'}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <span>Order Now</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </Button>
              </Link>

              {user ? (
                <Link to="/customer/profile">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
                  >
                    <span>My Profile</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
                  >
                    <span>Create Account</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs font-semibold text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-accent" />
                <span>30-Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>100% Quality Ingredients</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-accent" />
                <span>50,000+ Happy Foodies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playful Food Pun Banner */}
      <section className="bg-primary text-primary-foreground py-4 px-4 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-center">
          <span>🍕 Freshly Baked Every 15 Minutes</span>
          <span className="hidden md:inline">•</span>
          <span>🧀 Real Mozzarella Pulls</span>
          <span className="hidden md:inline">•</span>
          <span>🔥 Use Code "WELCOME10" For 10% Off</span>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-20 bg-muted/40 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary text-xs font-black uppercase tracking-wider">The BigBite Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-1">
              Why Sri Lanka Chooses BigBite
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-3">
              No half-baked cravings. From our signature stone-crust recipe to contactless delivery across Colombo and Kandy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">Hand-Tossed Daily</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Made from premium flour and fermented for 24 hours to give you that golden, cloud-soft interior and satisfying crunchy rim.
              </p>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">Piping Hot Delivery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Insulated thermal delivery packs keep your pizza bubbling and crisp from our ovens straight to your dining table.
              </p>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">Local Flavors & Deals</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Specially tailored menu items with real fiery spices, BBQ chicken, and everyday pocket-friendly combo promos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-16 bg-background text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Ready to Take Your First <span className="text-primary">BigBite</span>?
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {user
              ? 'Select your branch now and order your favorite piping-hot pizzas in seconds.'
              : 'Sign in or create your free account now to select your branch and order your favorite slice in seconds.'}
          </p>
          <div className="pt-2">
            <Link to={user ? '/order' : '/login'}>
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <span>{user ? 'Order Food Now' : 'Get Started Now'}</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-card text-muted-foreground text-xs py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} BigBite Food Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
