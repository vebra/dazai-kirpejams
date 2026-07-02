-- ============================================
-- 079: cancel_rep_pending_order — „apmokėto netrinti" guard'as pačioje RPC
-- ============================================
-- Audito B7 užbaigimas. Patikra „apmokėto (grynais/kortele) užsakymo atšaukti
-- negalima" iki šiol gyveno tik server action'e (vadybininke/actions.ts), o
-- funkcija su grant'u authenticated leido ją apeiti kviečiant RPC tiesiogiai
-- per Supabase REST su sesijos žetonu. Perkeliam patikrą į funkciją — fizinis
-- apmokėto užsakymo DELETE paliktų apskaitą be pėdsako; tokį atšaukia tik
-- admin per savo srautą (žymi cancelled, įrašas lieka).
--
-- App lygio pre-check actions.ts lieka — draugiškesnė žinutė ir apsauga
-- deploy'inus kodą anksčiau nei pritaikyta migracija.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create or replace function cancel_rep_pending_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_o orders%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;

  select * into v_o from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_o.placed_by is distinct from v_uid then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_o.approval_status is distinct from 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;
  if v_o.payment_status = 'paid' then
    return jsonb_build_object('ok', false, 'reason', 'paid');
  end if;

  delete from order_items where order_id = p_order_id;
  delete from orders where id = p_order_id;
  return jsonb_build_object('ok', true);
end;
$$;

notify pgrst, 'reload schema';
