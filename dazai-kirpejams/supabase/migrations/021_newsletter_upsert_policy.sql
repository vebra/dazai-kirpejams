-- Newsletter subscribe forma naudoja `upsert` su `onConflict: 'email'`,
-- tad kai email'as jau egzistuoja, Supabase vykdo UPDATE vietoj INSERT.
-- Be UPDATE policy anoniminiams, RLS blokuoja ir forma grąžina klaidą
-- "Nepavyko užprenumeruoti".
--
-- UPDATE čia saugu: SELECT policy public'ui nėra (email'ų išgauti negalima),
-- o UPDATE'u blogiausiu atveju galima tik reaktyvuoti prenumeratą, kurios
-- savininkas bet kada gali vėl užsiprenumeruoti ir pats.

create policy "Public update newsletter" on newsletter_subscribers
  for update using (true) with check (true);
