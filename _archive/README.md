# _archive — neaktualus turinys

Čia perkelta tai, kas projekte nebedalyvauja, bet saugoma istoriniais tikslais.

## html-prototype/

Pirminis statinis HTML prototipas — 17 puslapių, CSS, JS, nuotraukos. Sukurta pirmu commit'u `0a90fda "Pilna www.dazaikirpejams.lt svetainė"` prieš perėjimą į Next.js. Nėra jokių ryšių su dabartiniu [dazai-kirpejams/](../dazai-kirpejams/) projektu — tik referencija dizaino sprendimams.

## instructions-old.md

Senesnė, trumpesnė (278 eil.) [CLAUDE.md](../CLAUDE.md) (804 eil.) versija. Turinys pasenęs.

## one-off-scripts/

Vienkartiniai migracijų paleidimo scriptai — migracijos jau pritaikytos prod DB:

- `run-migration-011.ts` — blog posts seed
- `run-migration-012.ts` — baneriai
- `run-migration-017.ts` — Color SHOCK PDF pavadinimai

Pati migracijų SQL logika lieka `dazai-kirpejams/supabase/migrations/`.
