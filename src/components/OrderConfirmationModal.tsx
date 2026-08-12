import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, X } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderId: string | null;
  estimatedMinutes?: number;
  onTrackOrder: () => void;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  orderId,
  estimatedMinutes = 35,
  onTrackOrder,
  onClose,
}) => {
  if (!isOpen || !orderId) return null;

  return (
    <div className="bm-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title">
      <button type="button" aria-label="Close order confirmation" className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="bm-modal-panel relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#111417] p-6 shadow-[var(--bm-shadow-deep)] sm:p-8">
        <button type="button" aria-label="Close order confirmation" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bm-line)] text-[var(--bm-ink-soft)] transition hover:border-[var(--bm-ember)] hover:bg-[var(--bm-ember)]/10 hover:text-[var(--bm-ember)]">
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7eee5] text-[#6b836f]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--bm-terracotta)]">Order confirmed</p>
        <h2 id="order-confirmation-title" className="mt-2 bm-display text-3xl font-bold leading-tight text-[var(--bm-ink)]">Your meal is officially on its way.</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--bm-ink-soft)]">Your order was accepted by BM Food and is now connected to live delivery tracking.</p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e8dcc8] bg-[#f5eee6] p-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--bm-terracotta)]" />
          <div>
            <p className="text-xs font-extrabold text-[#1a1512]">Live countdown started</p>
            <p className="mt-1 text-xs leading-5 text-[#6c625b]">Estimated arrival in about {estimatedMinutes} minutes. The timer will update as the kitchen and rider progress.</p>
          </div>
        </div>
        <p className="mt-4 truncate text-[10px] font-bold uppercase tracking-[.12em] text-[var(--bm-ink-soft)]">Order #{orderId.slice(0, 10)}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onTrackOrder} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f5eee6] px-4 py-3 text-xs font-extrabold text-[#1a1512] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--bm-ember)] hover:shadow-[0_12px_28px_rgba(255,90,31,.18)]">
            Track my order <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-[var(--bm-line)] px-4 py-3 text-xs font-extrabold text-[var(--bm-ink-soft)] transition hover:border-[var(--bm-ember)] hover:bg-[var(--bm-ember)]/10 hover:text-[var(--bm-ember)]">Keep browsing</button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;

