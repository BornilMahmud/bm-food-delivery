import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react';
import { Food } from '../types';
import { useCart } from '../contexts/CartContext';
import { ImageWithFallback } from './ImageWithFallback';
import { calculateOptionDelta, SelectedFoodOption } from '../lib/orderMath';

interface FoodDetailModalProps {
  food: Food | null;
  onClose: () => void;
  onDirectOrder?: (food: Food, qty: number, notes?: string, selectedOptions?: SelectedFoodOption[]) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose, onDirectOrder }) => {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setQty(1);
    setNotes('');
    setSelected({});
  }, [food?.id]);

  const selectedOptions = useMemo<SelectedFoodOption[]>(() => {
    if (!food) return [];
    return (Object.entries(selected) as Array<[string, string[]]>).flatMap(([groupId, choiceIds]) => {
      const group = food.options?.find((item) => item.id === groupId);
      return choiceIds.map((choiceId) => {
        const choice = group?.choices.find((item) => item.id === choiceId);
        return choice && group ? { groupId, groupName: group.name, choiceId, choiceLabel: choice.label, priceDelta: choice.priceDelta } : null;
      }).filter((item): item is SelectedFoodOption => Boolean(item));
    });
  }, [food, selected]);

  if (!food) return null;
  const effectivePrice = food.discountPrice ?? food.price;
  const optionDelta = calculateOptionDelta(food, selectedOptions);
  const unitPrice = effectivePrice + (optionDelta || 0);
  const optionsValid = optionDelta !== null;

  const toggleChoice = (groupId: string, choiceId: string, type: 'single' | 'multiple') => {
    setSelected((previous) => {
      const current = previous[groupId] || [];
      if (type === 'single') return { ...previous, [groupId]: current[0] === choiceId ? [] : [choiceId] };
      return { ...previous, [groupId]: current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId] };
    });
  };

  const handleAdd = () => {
    if (!optionsValid) {
      window.alert('Please complete the required food options before adding this dish.');
      return;
    }
    for (let index = 0; index < qty; index += 1) addItem(food, undefined, notes, selectedOptions);
    onClose();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-[#201b17]/70 backdrop-blur-sm" onClick={onClose} /><div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-[var(--bm-line)] bg-[var(--bm-paper-strong)] shadow-[var(--bm-shadow-deep)]"><div className="relative h-56 overflow-hidden sm:h-72"><ImageWithFallback src={food.imageUrl} alt={food.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><button onClick={onClose} aria-label="Close food details" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/70"><X className="h-4 w-4" /></button><div className="absolute bottom-5 left-5 right-5"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f5d9a7]">Customize your order</p><h2 className="bm-display mt-2 text-3xl leading-none text-white sm:text-4xl">{food.name}</h2></div></div><div className="space-y-5 p-5 sm:p-7"><div className="flex items-center gap-4 text-xs font-bold text-[var(--bm-ink-soft)]"><span className="flex items-center gap-1.5 text-[var(--bm-brass)]"><Star className="h-3.5 w-3.5 fill-current" />{food.rating.toFixed(1)} rating</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[var(--bm-terracotta)]" />{food.preparationTime} min prep</span></div><p className="text-sm leading-6 text-[var(--bm-ink-soft)]">{food.description}</p>{food.options?.map((group) => <fieldset key={group.id} className="rounded-2xl border border-[var(--bm-line)] p-4"><legend className="px-1 text-xs font-extrabold text-[var(--bm-ink)]">{group.name} {group.required && <span className="text-[var(--bm-terracotta)]">*</span>}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{group.choices.map((choice) => { const active = selected[group.id]?.includes(choice.id); return <button key={choice.id} type="button" onClick={() => toggleChoice(group.id, choice.id, group.type)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-xs transition ${active ? 'border-[var(--bm-terracotta)] bg-[#fbefe9] text-[var(--bm-terracotta)]' : 'border-[var(--bm-line)] text-[var(--bm-ink-soft)] hover:border-[var(--bm-terracotta)]/50'}`}><span className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? 'border-[var(--bm-terracotta)] bg-[var(--bm-terracotta)]' : 'border-[var(--bm-line)]'}`}>{active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>{choice.label}</span><span className="font-extrabold">{choice.priceDelta ? `+৳${choice.priceDelta}` : 'Included'}</span></button>; })}</div></fieldset>)}<div><label className="text-xs font-extrabold text-[var(--bm-ink)]">Special cooking request</label><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. less spicy, sauce on the side" className="mt-2 w-full rounded-xl border border-[var(--bm-line)] bg-[var(--bm-paper)] px-3 py-3 text-xs text-[var(--bm-ink)] focus:outline-none" /></div><div className="flex flex-col gap-4 border-t border-[var(--bm-line)] pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex items-center gap-1 rounded-full border border-[var(--bm-line)] p-1"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--bm-ink)] hover:bg-[var(--bm-paper)]"><Minus className="h-3.5 w-3.5" /></button><span className="w-6 text-center text-sm font-extrabold text-[var(--bm-ink)]">{qty}</span><button onClick={() => setQty(Math.min(99, qty + 1))} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--bm-ink)] hover:bg-[var(--bm-paper)]"><Plus className="h-3.5 w-3.5" /></button></div><div><p className="text-[10px] font-bold text-[var(--bm-ink-soft)]">Total</p><p className="text-xl font-extrabold text-[var(--bm-terracotta)]">৳{unitPrice * qty}</p></div></div><div className="flex gap-2"><button onClick={handleAdd} className="bm-button-secondary flex-1"><ShoppingBag className="h-4 w-4" /> Add</button><button onClick={() => { if (optionsValid) { onDirectOrder?.(food, qty, notes, selectedOptions); onClose(); } else window.alert('Please complete the required food options before ordering.'); }} className="bm-button flex-1">Order now <span>৳{unitPrice * qty}</span></button></div></div></div></div></div>;
};
