import React from 'react';
import { BarChart3, Banknote, CheckCircle2, CircleDollarSign, Clock3 } from 'lucide-react';
import { Order } from '../../types';
import { isCashOrder, recognizedRevenue } from '../../lib/orderMath';

interface AdminOverviewChartsProps {
  orders: Order[];
}

const revenueFor = (order: Order) => (recognizedRevenue([order]) || 0);

const dateValue = (value: any) => {
  if (value?.toDate) return value.toDate() as Date;
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const money = (value: number) => `৳${Math.round(value).toLocaleString()}`;

export const AdminOverviewCharts: React.FC<AdminOverviewChartsProps> = ({ orders }) => {
  const now = new Date();
  const trend = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - offset));
    const key = dayKey(date);
    const matching = orders.filter((order) => dayKey(dateValue(order.createdAt)) === key);
    return {
      label: date.toLocaleDateString('en-BD', { weekday: 'short' }),
      revenue: matching.reduce((sum, order) => sum + revenueFor(order), 0),
      orders: matching.length,
    };
  });

  const statusCounts = [
    ['Pending', orders.filter((order) => ['pending', 'confirmed', 'preparing'].includes(order.orderStatus)).length, 'var(--bm-saffron)'],
    ['In delivery', orders.filter((order) => ['ready', 'picked_up', 'on_the_way', 'delivering'].includes(order.orderStatus)).length, 'var(--bm-ember-soft)'],
    ['Delivered', orders.filter((order) => order.orderStatus === 'delivered').length, 'var(--bm-basil)'],
    ['Cancelled', orders.filter((order) => order.orderStatus === 'cancelled').length, 'var(--bm-error)'],
  ] as const;

  const deliveredCash = orders.filter((order) => order.orderStatus === 'delivered' && isCashOrder(order)).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidDigital = orders.filter((order) => order.paymentStatus === 'paid' && !isCashOrder(order)).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const outstanding = orders.filter((order) => order.paymentStatus === 'pending' || order.paymentStatus === 'manual_pending').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const maxRevenue = Math.max(1, ...trend.map((item) => item.revenue));
  const maxStatus = Math.max(1, ...statusCounts.map(([, count]) => count));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
      <section className="bm-card min-w-0 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="bm-eyebrow">Live performance</p>
            <h2 className="mt-1 text-lg font-black text-[var(--bm-cream)]">Revenue pulse</h2>
            <p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Paid orders and delivered cash across the last seven days.</p>
          </div>
          <BarChart3 className="h-5 w-5 shrink-0 text-[var(--bm-ember-soft)]" />
        </div>
        <div className="mt-7 grid h-44 grid-cols-7 items-end gap-2 sm:gap-3" aria-label="Seven day revenue chart">
          {trend.map((item) => (
            <div key={item.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
              <span className="text-[9px] font-extrabold text-[var(--bm-ink-soft)]">{item.revenue ? money(item.revenue) : '—'}</span>
              <div className="flex h-32 w-full items-end rounded-xl bg-[rgba(247,239,230,.05)] p-1">
                <div className="w-full rounded-lg bg-gradient-to-t from-[var(--bm-ember)] to-[var(--bm-saffron)] transition-[height] duration-500" style={{ height: `${Math.max(8, (item.revenue / maxRevenue) * 100)}%` }} title={`${item.label}: ${money(item.revenue)}`} />
              </div>
              <span className="text-[10px] font-black text-[var(--bm-cream)]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bm-card min-w-0 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="bm-eyebrow">Order flow</p>
            <h2 className="mt-1 text-lg font-black text-[var(--bm-cream)]">Status mix</h2>
            <p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Current order movement across the live queue.</p>
          </div>
          <Clock3 className="h-5 w-5 shrink-0 text-[var(--bm-saffron)]" />
        </div>
        <div className="mt-7 space-y-4">
          {statusCounts.map(([label, count, color]) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold"><span className="text-[var(--bm-ink-soft)]">{label}</span><span className="text-[var(--bm-cream)]">{count}</span></div>
              <div className="h-2 rounded-full bg-[rgba(247,239,230,.07)]"><div className="h-2 rounded-full transition-[width] duration-500" style={{ width: `${Math.max(count ? 8 : 0, (count / maxStatus) * 100)}%`, backgroundColor: color }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bm-card min-w-0 p-5 sm:p-6 xl:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="bm-eyebrow">Cash control</p>
            <h2 className="mt-1 text-lg font-black text-[var(--bm-cream)]">Collected funds overview</h2>
            <p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Delivered COD orders are counted as collected cash immediately after delivery.</p>
          </div>
          <CircleDollarSign className="h-5 w-5 shrink-0 text-[var(--bm-basil)]" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(143,164,140,.18)] bg-[rgba(143,164,140,.09)] p-4"><div className="flex items-center gap-2 text-[var(--bm-basil)]"><Banknote className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-wider">Delivered cash</span></div><p className="mt-2 text-xl font-black text-[var(--bm-cream)]">{money(deliveredCash)}</p></div>
          <div className="rounded-2xl border border-[rgba(255,90,31,.18)] bg-[rgba(255,90,31,.09)] p-4"><div className="flex items-center gap-2 text-[var(--bm-ember-soft)]"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-wider">Paid digital</span></div><p className="mt-2 text-xl font-black text-[var(--bm-cream)]">{money(paidDigital)}</p></div>
          <div className="rounded-2xl border border-[rgba(243,181,98,.18)] bg-[rgba(243,181,98,.09)] p-4"><div className="flex items-center gap-2 text-[var(--bm-saffron)]"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-wider">Outstanding</span></div><p className="mt-2 text-xl font-black text-[var(--bm-cream)]">{money(outstanding)}</p></div>
        </div>
      </section>
    </div>
  );
};
