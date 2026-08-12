import React from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  setCurrentView?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <footer className="border-t border-[var(--bm-line)] bg-[#0b0e11] text-[#c9beb4]">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_.75fr_.75fr_1fr]">
          <div className="max-w-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-white"><img src="/bm-food-delivery-logo.png" alt="BM Food Delivery" className="h-full w-full object-cover" /></span><div><p className="text-sm font-extrabold tracking-[.08em] text-[#f7efe6]">BM FOOD DELIVERY</p><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#f3b562]">Good food, fast delivery</p></div></div><p className="mt-6 text-sm leading-7 text-[#9b9087]">Dhaka’s kitchens. Good food, fast delivery.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#f3b562]">Verified kitchens</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8fa48c]">Live status</span></div></div>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f3b562]">Explore</p><div className="mt-5 grid gap-3 text-xs font-bold"><button onClick={() => { setCurrentView?.('home'); window.setTimeout(() => scrollTo('trending-section'), 40); }} className="flex items-center justify-between text-left text-[#c9beb4] transition hover:text-[var(--bm-ember)]">Trending now <ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={() => { setCurrentView?.('home'); window.setTimeout(() => scrollTo('categories-section'), 40); }} className="flex items-center justify-between text-left text-[#c9beb4] transition hover:text-[var(--bm-ember)]">Categories <ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={() => setCurrentView?.('restaurants')} className="flex items-center justify-between text-left text-[#c9beb4] transition hover:text-[var(--bm-ember)]">Restaurants <ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={() => setCurrentView?.('user-orders')} className="flex items-center justify-between text-left text-[#c9beb4] transition hover:text-[var(--bm-ember)]">Track order <ArrowUpRight className="h-3.5 w-3.5" /></button></div></div>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f3b562]">Delivery hubs</p><div className="mt-5 grid gap-3 text-xs leading-5 text-[#9b9087]"><p>Dhaka · Dhanmondi & Gulshan</p><p>Dhaka · Uttara & Banani</p><p>Dhaka · Mirpur & Mohammadpur</p><p>Dhaka · Old Dhaka & Lalbagh</p><p>Chittagong & Sylhet · coming soon</p></div></div>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f3b562]">Concierge</p><div className="mt-5 grid gap-4 text-xs"><p className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5a1f]" /><span>+880 9612-345678<br /><span className="text-[#83766e]">24/7 hotline</span></span></p><p className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5a1f]" /><span>support@bmfood.com<br /><span className="text-[#83766e]">For kitchens and customers</span></span></p><p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5a1f]" /><span>BM Food Tower<br /><span className="text-[#83766e]">Gulshan 2, Dhaka 1212</span></span></p></div></div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[10px] font-bold text-[#83766e] sm:flex-row"><p>© 2026 BM Food Delivery Ltd. All rights reserved.</p><p>Dhaka, delivered.</p></div>
      </div>
    </footer>
  );
};
