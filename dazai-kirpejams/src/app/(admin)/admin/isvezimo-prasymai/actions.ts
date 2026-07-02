'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Vadybininkės „išvežimo prekybai" prašymų sprendimai (migr 075).
 * Patvirtinus — prekės išduodamos per issue_stock_to_rep_batch (sandėlis −,
 * jos atsargos +). Service-role: RPC granted tik service_role, o sprendimo
 * įrašymas bypass'ina RLS (puslapis ir veiksmai gating'inami requireAdmin()).
 */
export type IssuedSheetItem = { name: string; qty: number; balance: number }
export type IssueReqResult = {
  ok: boolean
  error?: string
  issued?: { rep: string; at: string; items: IssuedSheetItem[] }
}

export async function approveIssueRequest(id: string): Promise<IssueReqResult> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'Trūksta prašymo ID.' }

  const sb = createServerClient()
  const { data: req, error } = await sb
    .from('rep_issue_requests')
    .select('id, rep_id, status, items')
    .eq('id', id)
    .maybeSingle<{
      id: string
      rep_id: string
      status: string
      items: Array<{ product_id: string; qty: number; name: string }> | null
    }>()
  if (error || !req) return { ok: false, error: 'Prašymas nerastas.' }
  if (req.status !== 'pending')
    return { ok: false, error: 'Prašymas jau apdorotas. Atnaujinkite sąrašą.' }

  const items = (Array.isArray(req.items) ? req.items : [])
    .filter((i) => i && i.product_id && Number.isInteger(i.qty) && i.qty > 0)
    .map((i) => ({ product_id: i.product_id, qty: i.qty }))
  if (!items.length) return { ok: false, error: 'Prašymas be prekių.' }

  // Auditas B10: atominis claim PRIEŠ RPC (compare-and-swap) — du lygiagretūs
  // patvirtinimai (dvi kortelės / dvigubas klikas) anksčiau abu praeidavo
  // status patikrą ir prekės būtų išduotos dukart. Update sąlygotas
  // .eq('status','pending') — antrasis nepakeis nė vienos eilutės.
  const { data: claimed } = await sb
    .from('rep_issue_requests')
    .update({ status: 'approved', decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (!claimed || claimed.length === 0)
    return { ok: false, error: 'Prašymas jau apdorotas. Atnaujinkite sąrašą.' }

  const { data: prof } = await sb
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', req.rep_id)
    .maybeSingle<{ first_name: string | null; last_name: string | null }>()
  const repName =
    `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim() || 'Vadybininkė'

  const { data: res, error: rErr } = await sb.rpc('issue_stock_to_rep_batch', {
    p_items: items,
    p_rep: repName,
    p_rep_id: req.rep_id,
  })
  const r = res as {
    ok?: boolean
    reason?: string
    stock?: number
    name?: string
    items?: Array<{ name: string; qty: number; balance: number }>
  } | null
  if (rErr || !r?.ok) {
    const msg =
      r?.reason === 'insufficient_stock'
        ? `Nepakanka „${r?.name ?? 'prekės'}" likučio (yra ${r?.stock ?? 0}). Niekas neišduota — sumažinkite kiekį arba papildykite sandėlį.`
        : rErr?.message ?? 'Nepavyko išduoti.'
    console.error('[admin/isvezimo-prasymai] approve:', rErr?.message ?? r?.reason)
    // RPC nepavyko (pvz. nepakanka likučio) — best-effort grąžinam claim'ą
    // atgal į 'pending', kad prašymą būtų galima patvirtinti vėliau.
    const { error: revertErr } = await sb
      .from('rep_issue_requests')
      .update({ status: 'pending', decided_at: null })
      .eq('id', id)
    if (revertErr) {
      console.error(
        '[admin/isvezimo-prasymai] approve revert failed:',
        revertErr.message
      )
    }
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/isvezimo-prasymai')
  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  return {
    ok: true,
    issued: {
      rep: repName,
      at: new Date().toISOString(),
      items: (r.items ?? []).map((i) => ({ name: i.name, qty: i.qty, balance: i.balance })),
    },
  }
}

export async function rejectIssueRequest(
  id: string,
  reason: string
): Promise<IssueReqResult> {
  await requireAdmin()
  const trimmed = (reason ?? '').trim()
  if (!id) return { ok: false, error: 'Trūksta prašymo ID.' }
  if (!trimmed) return { ok: false, error: 'Nurodykite atmetimo priežastį.' }

  const sb = createServerClient()
  const { data: req } = await sb
    .from('rep_issue_requests')
    .select('status')
    .eq('id', id)
    .maybeSingle<{ status: string }>()
  if (!req) return { ok: false, error: 'Prašymas nerastas.' }
  if (req.status !== 'pending')
    return { ok: false, error: 'Prašymas jau apdorotas.' }

  // Auditas B10 (analogiškai approve): atominis CAS — jei tarp patikros ir
  // update prašymą spėjo apdoroti kitas admin'as, nepakeičiam nė vienos
  // eilutės ir grąžinam klaidą, o ne tyliai perrašom sprendimą.
  const { data: claimed } = await sb
    .from('rep_issue_requests')
    .update({
      status: 'rejected',
      reject_reason: trimmed,
      decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (!claimed || claimed.length === 0)
    return { ok: false, error: 'Prašymas jau apdorotas.' }

  revalidatePath('/admin/isvezimo-prasymai')
  return { ok: true }
}
