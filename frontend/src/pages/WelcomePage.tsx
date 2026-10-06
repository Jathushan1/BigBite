import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Utensils, ShieldCheck, Zap, Award, Sparkles, Heart, Star, Pizza, ChevronRight } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { PromoCarousel } from '../components/PromoCarousel'

export const WelcomePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-16 sm:py-24 lg:py-28">
        {/* Background Ambient Glows */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-accent text-xs font-black uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Handcrafted • Piping Hot • 30-Min Delivery</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
                Don't play <span className="text-primary underline decoration-accent/50 underline-offset-8">ketchup</span> with your hunger.
              </h1>

              <p className="text-base sm:text-xl text-neutral-300 font-medium leading-relaxed max-w-2xl">
                Crave the crunch. Savor the sauce. Handcrafted artisanal stone-crust pizzas, crispy loaded sides, and icy drinks delivered straight to your door across Sri Lanka.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <Link to={user ? '/order' : '/login'}>
                  <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2.5">
                    <span>Order Food Now</span>
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
                      <span>My Profile & Orders</span>
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
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span>30-Min Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>100% Quality Ingredients</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>50k+ Happy Foodies</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Pizza Showcase with Floating Badges */}
            <div className="lg:col-span-5 relative hidden sm:flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Pizza Image with Subtle Floating Animation */}
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/15 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80"
                    alt="Artisan Pepperoni Pizza"
                    className="w-full h-full object-cover scale-110"
                  />
                </div>

                {/* Floating Tag 1: Top Rated */}
                <div className="absolute -top-4 -left-4 bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center font-bold">
                    <Star className="w-5 h-5 fill-warning" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">4.9 / 5.0 Rating</div>
                    <div className="text-[11px] text-neutral-400 font-medium">1,200+ Reviews</div>
                  </div>
                </div>

                {/* Floating Tag 2: Best Seller */}
                <div className="absolute -bottom-4 -right-4 bg-black/80 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <Pizza className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Pepperoni Deluxe</div>
                    <div className="text-[11px] text-accent font-bold">LKR 1,400.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playful Food Pun Ticker Banner */}
      <section className="bg-primary text-primary-foreground py-3.5 px-4 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-black uppercase tracking-wider text-center">
          <span>🍕 Freshly Baked Every 15 Mins</span>
          <span className="hidden md:inline text-white/40">•</span>
          <span>🧀 100% Real Mozzarella Pulls</span>
          <span className="hidden md:inline text-white/40">•</span>
          <span>🔥 Use Code "WELCOME10" For 10% Off</span>
          <span className="hidden md:inline text-white/40">•</span>
          <span>🛵 Live Delivery Tracking</span>
        </div>
      </section>

      {/* Promotional Slides / Deals Carousel Section */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-primary text-xs font-black uppercase tracking-wider">Hot Deals & Combos</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              Today's Chef Specials
            </h2>
          </div>
          <Link
            to="/order"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 group"
          >
            <span>View All Deals</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <PromoCarousel />
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 sm:py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-primary text-xs font-black uppercase tracking-wider">The BigBite Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-1">
              Why Sri Lanka Loves BigBite
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-3">
              No half-baked cravings. From our signature stone-crust recipe to fast contactless delivery across Colombo and Kandy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Hand-Tossed Daily</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Made from premium slow-fermented dough for 24 hours to create a golden, cloud-soft interior with a satisfying crunchy rim.
              </p>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Piping Hot Delivery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Insulated thermal delivery packs keep your pizza bubbling and crisp from our ovens straight to your dining table.
              </p>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Local Flavors & Deals</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Specially crafted menu items featuring authentic spicy seasonings, BBQ chicken, and pocket-friendly combo promos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-20 bg-background text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Ready to Take Your First <span className="text-primary">BigBite</span>?
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {user
              ? 'Select your branch now and order your favorite piping-hot pizzas in seconds.'
              : 'Sign in or create your free account now to select your branch and order your favorite slice in seconds.'}
          </p>
          <div className="pt-2">
            <Link to={user ? '/order' : '/login'}>
              <Button variant="glow" size="lg" className="gap-2 px-8">
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
