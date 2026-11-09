import React, { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

type Coupon = {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
};

const EMPTY = { code: '', discount_type: 'percent' as const, discount_value: 10,
  starts_at: '', expires_at: '' };

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [draft, setDraft] = useState<{ code: string; discount_type: 'percent' | 'fixed';
    discount_value: number; starts_at: string; expires_at: string }>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  const request = useCallback(async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    payload?: unknown, id?: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase Auth indisponível.');
    const { data: { session } } = await client.auth.getSession();
    if (!session?.access_token) throw new Error('Entre novamente como administrador.');
    const response = await fetch('/api/admin/catalog?table=coupons' + (id ? '&id=' + encodeURIComponent(id) : ''), {
      method,
      headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      cache: 'no-store'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível salvar. Confira suas permissões.');
    return result;
  }, []);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await request('GET');
      setCoupons(Array.isArray(data) ? data : []);
      setReady(true);
      setMessage('');
    } catch (err) {
      setReady(false);
      setMessage(err instanceof Error ? err.message : 'Falha ao consultar cupons.');
    } finally {
      setBusy(false);
    }
  }, [request]);

  useEffect(() => { void reload(); }, [reload]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const dates = (value: string) => value ? new Date(value).toISOString() : null;
      const payload = {
        code: draft.code.trim().toUpperCase(), discount_type: draft.discount_type,
        discount_value: Number(draft.discount_value),
        starts_at: dates(draft.starts_at), expires_at: dates(draft.expires_at)
      };
      await request(editing ? 'PATCH' : 'POST', payload, editing || undefined);
      setDraft(EMPTY);
      setEditing(null);
      setMessage(editing ? 'Cupom atualizado.' : 'Cupom criado como inativo. Ative quando estiver pronto.');
      const { data } = await request('GET');
      setCoupons(Array.isArray(data) ? data : []);
      setReady(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar cupom.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (coupon: Coupon) => {
    setBusy(true);
    try {
      await request('PATCH', { is_active: !coupon.is_active }, coupon.id);
      const { data } = await request('GET');
      setCoupons(Array.isArray(data) ? data : []);
      setMessage(coupon.is_active ? 'Cupom desativado.' : 'Cupom ativado para gerenciamento. Aplicação em pedidos ainda não está liberada.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha ao alterar status.');
    } finally { setBusy(false); }
  };

  const edit = (coupon: Coupon) => {
    const dateValue = (value: string | null) => value ? new Date(value).toISOString().slice(0,16) : '';
    setDraft({ code: coupon.code, discount_type: coupon.discount_type,
      discount_value: coupon.discount_value, starts_at: dateValue(coupon.starts_at),
      expires_at: dateValue(coupon.expires_at) });
    setEditing(coupon.id);
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm('Excluir definitivamente o cupom ' + coupon.code + '?')) return;
    setBusy(true);
    try {
      await request('DELETE', undefined, coupon.id);
      const { data } = await request('GET');
      setCoupons(Array.isArray(data) ? data : []);
      setMessage('Cupom excluído.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Falha ao excluir.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Cupons e Promoções</h2>
          <p className="text-sm text-slate-400 mt-1">Somente administradores autorizados podem gerenciar os códigos.</p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={busy}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 disabled:opacity-50">Atualizar</button>
      </div>
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 p-3 text-xs">
        Cupons podem ser cadastrados e ativados aqui, mas ainda não são aplicados a pagamentos ou pedidos.
        A integração final do cálculo de desconto no servidor será liberada junto ao checkout seguro.
      </p>
      {message && <p role="status" className="rounded-xl border border-white/20 bg-white/5 p-3 text-xs">{message}</p>}
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-[#14141D] p-4">
        <label className="text-xs text-slate-300 space-y-1">Código (4 a 24 caracteres)
          <input required minLength={4} maxLength={24} pattern="[A-Za-z0-9_-]{4,24}"
            value={draft.code} onChange={e => setDraft(x => ({ ...x, code:e.target.value.toUpperCase() }))}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white" placeholder="PROMO10"/>
        </label>
        <label className="text-xs text-slate-300 space-y-1">Tipo de desconto
          <select value={draft.discount_type} onChange={e => setDraft(x => ({ ...x, discount_type:e.target.value as 'percent' | 'fixed' }))}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white">
            <option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option>
          </select>
        </label>
        <label className="text-xs text-slate-300 space-y-1">Valor
          <input type="number" required min="0.01" max={draft.discount_type === 'percent' ? 100 : 10000} step="0.01"
            value={draft.discount_value} onChange={e => setDraft(x => ({ ...x,discount_value:Number(e.target.value) }))}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white"/>
        </label>
        <label className="text-xs text-slate-300 space-y-1">Início (opcional)
          <input type="datetime-local" value={draft.starts_at} onChange={e => setDraft(x => ({ ...x,starts_at:e.target.value }))}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white"/>
        </label>
        <label className="text-xs text-slate-300 space-y-1">Validade (opcional)
          <input type="datetime-local" value={draft.expires_at} onChange={e => setDraft(x => ({ ...x,expires_at:e.target.value }))}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white"/>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={busy || !ready}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold disabled:opacity-50">
            {busy ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar cupom (inativo)'}
          </button>
          {editing && <button type="button" className="p-3 rounded-xl bg-white/10" onClick={() => { setDraft(EMPTY);setEditing(null);}}>Cancelar</button>}
        </div>
      </form>
      <div className="grid gap-3">
        {ready && coupons.length === 0 && <p className="text-slate-400 text-sm">Nenhum cupom cadastrado.</p>}
        {coupons.map(coupon => (
          <div key={coupon.id} className="rounded-xl border border-white/10 bg-[#14141D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold">{coupon.code} <span className={coupon.is_active ? 'text-emerald-400' : 'text-slate-400'}>· {coupon.is_active ? 'Ativo' : 'Inativo'}</span></p>
              <p className="text-xs text-slate-400">{coupon.discount_type === 'percent' ? coupon.discount_value + '%' : 'R$ ' + Number(coupon.discount_value).toFixed(2)} de desconto
                {coupon.expires_at ? ' · até ' + new Date(coupon.expires_at).toLocaleDateString('pt-BR') : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => edit(coupon)} className="px-3 py-2 rounded-lg bg-white/10 text-xs disabled:opacity-50">Editar</button>
              <button disabled={busy} onClick={() => void changeStatus(coupon)} className="px-3 py-2 rounded-lg bg-purple-600/30 text-xs disabled:opacity-50">{coupon.is_active ? 'Desativar' : 'Ativar'}</button>
              <button disabled={busy} onClick={() => void deleteCoupon(coupon)} className="px-3 py-2 rounded-lg bg-red-600/20 text-red-300 text-xs disabled:opacity-50">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
