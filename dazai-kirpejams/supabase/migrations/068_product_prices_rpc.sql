-- ============================================
-- 068: get_product_prices — kainos client-side TIK patvirtintiems
-- ============================================
-- Statiniam renderinimui (Fazė 1: prekės detalės puslapiai) kainos NEbestatinamos
-- į HTML — puslapis renderinamas kaip svečiui (kaina nukirpta), o patvirtintas
-- profesionalas kainas pasiima NARŠYKLĖJE per šią RPC. Taip:
--   • anoniminis/Google srautas gauna statinį CDN puslapį be kainų;
--   • kaina niekada nepatenka į statinį HTML (saugumas kaip iki šiol);
--   • tik approved profesionalas mato kainas (server-side patikra ČIA).
--
-- Grąžina kainas TIK jei kreipiasi prisijungęs approved vartotojas; kitaip
-- tuščia (RETURN be eilučių). security definer — kreipiasi į products lentelę,
-- kuri authenticated rolei prieinama tik per stulpelių grant'ą (067), bet
-- definer veikia savininko teisėmis. Grąžinami tik viešai matomi kainų laukai
-- (NE cost/b2b).
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

create or replace function get_product_prices(p_ids uuid[])
returns table (
  product_id uuid,
  price_cents int,
  sale_price_cents int,
  compare_price_cents int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Tik prisijungęs, admin patvirtintas profesionalas mato kainas.
  if not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid()
      and up.verification_status = 'approved'
  ) then
    return;
  end if;

  return query
    select p.id, p.price_cents, p.sale_price_cents, p.compare_price_cents
    from public.products p
    where p.id = any(p_ids)
      and p.is_active = true;
end;
$$;

grant execute on function get_product_prices(uuid[]) to authenticated;

notify pgrst, 'reload schema';
