/**
 * Pure SQL construction for the Base data admin.
 *
 * Decomplected from the React component: values in, SQL string out — no I/O, no
 * state, no effects. Referentially transparent, so it is trivially unit-tested and
 * composable. Curried (Haskell-style) so call sites partially apply and compose:
 *
 *   const into = insertInto('todos');   into({ title: 'x' })          // one table, many rows
 *   const set  = updateRow('todos')('id');   set('7')({ done: '1' })  // fix table+pk, vary row
 *
 * Escaping lives here and ONLY here (`ident` for identifiers, `literal` for
 * values) — the one place a caller-supplied string becomes SQL text.
 */

/** A record as edited in the UI: column name → string value. */
export type Fields = Record<string, string>;

/** Quote an identifier (table / column). Doubling `"` is the SQL-standard escape. */
export const ident = (name: string): string => `"${name.replace(/"/g, '""')}"`;

/** A user value as a SQL literal: blank/`null` → NULL, numeric → bare, else a
 *  single-quote-escaped string. The one value→literal coercion. */
export const literal = (value: string): string => {
  const v = value.trim();
  if (value === '' || /^null$/i.test(v)) return 'NULL';
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  return `'${value.replace(/'/g, "''")}'`;
};

/** `SELECT * FROM <table> LIMIT <n>` — limit fixed first, table varies. */
export const selectAll =
  (limit: number) =>
  (table: string): string =>
    `SELECT * FROM ${ident(table)} LIMIT ${limit}`;

/** INSERT a row. Blank fields are omitted so DB defaults / autoincrement apply. */
export const insertInto =
  (table: string) =>
  (row: Fields): string => {
    const cols = Object.entries(row).filter(([, v]) => v !== '');
    const names = cols.map(([k]) => ident(k)).join(', ');
    const values = cols.map(([, v]) => literal(v)).join(', ');
    return `INSERT INTO ${ident(table)} (${names}) VALUES (${values})`;
  };

/** UPDATE one row by primary key. The PK column is never written into SET. */
export const updateRow =
  (table: string) =>
  (pk: string) =>
  (id: string) =>
  (row: Fields): string => {
    const sets = Object.entries(row)
      .filter(([k]) => k !== pk)
      .map(([k, v]) => `${ident(k)} = ${literal(v)}`)
      .join(', ');
    return `UPDATE ${ident(table)} SET ${sets} WHERE ${ident(pk)} = ${literal(id)}`;
  };

/** DELETE one row by primary key. */
export const deleteRow =
  (table: string) =>
  (pk: string) =>
  (id: string): string =>
    `DELETE FROM ${ident(table)} WHERE ${ident(pk)} = ${literal(id)}`;
