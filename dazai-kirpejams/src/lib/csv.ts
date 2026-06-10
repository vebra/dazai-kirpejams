/**
 * CSV langelio paruošimas eksportui.
 *
 * Dvi apsaugos:
 * 1. Standartinis CSV escape — kabutės aplink reikšmes su `"`, `,`, `;`
 *    ar naujomis eilutėmis (vidinės `"` dvigubinamos).
 * 2. Formulių neutralizavimas — kliento įvedami laukai (vardas, el. paštas,
 *    pastabos) gali prasidėti `=`, `+`, `-`, `@`, TAB ar CR: Excel/LibreOffice
 *    tokį langelį VYKDO kaip formulę atidarius failą (CSV injection, pvz.
 *    `=HYPERLINK(...)` ar `=cmd|...`). Vien kabutės to nesustabdo — formulę
 *    nukenksmina tik priekyje pridėtas apostrofas (Excel jį rodo kaip tekstą).
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  // Grynų skaičių neliečiam (pvz. žurnalo delta „-5" turi likti skaičiumi).
  const isPlainNumber = /^-?\d+([.,]\d+)?$/.test(s)
  if (!isPlainNumber && /^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`
  }
  if (s.includes('"') || s.includes(',') || s.includes(';') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
