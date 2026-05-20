// No-op pakaitalas `server-only` paketui Vitest aplinkoje.
// Tikrasis `server-only` Next.js metu mestų klaidą, jei modulį importuotų
// client komponentas — tai apsaugo nuo netyčinio secret'ų nutekėjimo.
// Testuose šio guard'o nereikia (Vitest visada server-side), todėl
// vitest.config.ts'e jis alias'inamas į šį failą.
export {}
