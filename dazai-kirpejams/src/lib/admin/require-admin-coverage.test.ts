import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Apsauga „pamirštas requireAdmin()" spragos: scaninu visus
 * `src/app/(admin)/**\/actions.ts` failus ir tikrinu, kad kiekviena
 * EKSPORTUOTA async funkcija savo kūne kviestų `requireAdmin()`.
 *
 * Be šios apsaugos vienas pamirštas kvietimas = pilnas RLS apėjimas
 * (service-role klientas), nes admin action'ai naudoja service-role
 * Supabase klientą, kuris apeina RLS.
 *
 * Login action'as — legitimas išimtis: jis YRA prisijungimo įėjimas,
 * todėl negali reikalauti, kad jau būtum adminas. Po sėkmingo signIn
 * jis viduje atlieka `verifyAdminAfterLogin` — toks pat efektas.
 *
 * Šis testas — statinis tekstinis check'as (ne AST). Tikslas: rasti
 * pamirštas vietas, ne validuoti runtime'ą.
 */

const ADMIN_ACTIONS_ROOT = join(__dirname, '..', '..', 'app', '(admin)')

const ALLOWED_NO_REQUIRE_ADMIN: Record<string, Set<string>> = {
  // file path (santykinis adminActions root'ui) → leistinos eksportuotos
  // funkcijos be `requireAdmin()`. Login srautas yra įėjimo taškas.
  'admin/login/actions.ts': new Set(['loginAction']),
}

function walkActionsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      out.push(...walkActionsFiles(full))
    } else if (entry === 'actions.ts') {
      out.push(full)
    }
  }
  return out
}

function extractExportedFunctions(
  src: string
): { name: string; bodyStart: number; bodyEnd: number }[] {
  // Suranda visus `export (async )?function NAME(`. Kiekvienos funkcijos
  // „kūnu" laikome tekstą iki kitos eksportuotos funkcijos pradžios (ar
  // failo galo). Tai yra heuristika, ne tikras AST — bet pakanka
  // requireAdmin() egzistavimo patikrai. Vengiame body brace tracker'io,
  // nes return type annotacijoms (pvz. `Promise<{ ok: boolean }>`) ir
  // jose esantiems `{}` nereikia jokio specialaus apdorojimo.
  const re = /\bexport\s+(?:async\s+)?function\s+(\w+)\s*\(/g
  const matches: { name: string; sigStart: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    matches.push({ name: m[1], sigStart: m.index })
  }
  return matches.map((cur, idx) => ({
    name: cur.name,
    bodyStart: cur.sigStart,
    bodyEnd: matches[idx + 1]?.sigStart ?? src.length,
  }))
}

describe('admin actions.ts — kiekvienas eksportuotas action turi requireAdmin()', () => {
  const files = walkActionsFiles(ADMIN_ACTIONS_ROOT)

  it('rado bent kelis admin actions.ts failus (kad testas pats neapsigautų)', () => {
    expect(files.length).toBeGreaterThanOrEqual(8)
  })

  for (const file of files) {
    const relPath = relative(
      join(__dirname, '..', '..', 'app', '(admin)'),
      file
    ).replace(/\\/g, '/')
    const src = readFileSync(file, 'utf8')
    const fns = extractExportedFunctions(src)
    const allowed = ALLOWED_NO_REQUIRE_ADMIN[relPath] ?? new Set<string>()

    for (const fn of fns) {
      const body = src.slice(fn.bodyStart, fn.bodyEnd)
      const hasRequireAdmin = /\brequireAdmin\s*\(/.test(body)
      const isAllowedException = allowed.has(fn.name)

      it(`${relPath} :: ${fn.name} — turi requireAdmin() arba įtrauktas į išimtis`, () => {
        expect(
          hasRequireAdmin || isAllowedException,
          `Funkcija ${fn.name} faile ${relPath} neturi requireAdmin() ` +
            `iškvietimo. Jei tai legitimas išimtis (pvz. login srautas), ` +
            `pridėk ją į ALLOWED_NO_REQUIRE_ADMIN šio test failo viršuje.`
        ).toBe(true)
      })
    }
  }
})
