import {
  ident,
  literal,
  selectAll,
  insertInto,
  updateRow,
  deleteRow,
} from '@/components/database-manager/sql';

describe('base data admin — pure SQL builders', () => {
  describe('ident', () => {
    it('quotes identifiers', () => expect(ident('todos')).toBe('"todos"'));
    it('escapes embedded double-quotes', () => expect(ident('we"ird')).toBe('"we""ird"'));
  });

  describe('literal', () => {
    it('blank → NULL', () => expect(literal('')).toBe('NULL'));
    it('the word null → NULL (case-insensitive)', () => expect(literal('NuLl')).toBe('NULL'));
    it('integers stay bare', () => expect(literal('42')).toBe('42'));
    it('negatives and decimals stay bare', () => {
      expect(literal('-3')).toBe('-3');
      expect(literal('3.14')).toBe('3.14');
    });
    it('strings are quoted', () => expect(literal('hi')).toBe("'hi'"));
    it('escapes single quotes (injection-safe)', () =>
      expect(literal("O'Brien")).toBe("'O''Brien'"));
    it('neutralises an injection attempt', () =>
      expect(literal("x'); DROP TABLE users;--")).toBe("'x''); DROP TABLE users;--'"));
  });

  describe('selectAll (curried)', () => {
    it('builds a limited select', () =>
      expect(selectAll(50)('todos')).toBe('SELECT * FROM "todos" LIMIT 50'));
    it('is curried — fix the limit, vary the table', () => {
      const top10 = selectAll(10);
      expect(top10('a')).toBe('SELECT * FROM "a" LIMIT 10');
      expect(top10('b')).toBe('SELECT * FROM "b" LIMIT 10');
    });
  });

  describe('insertInto', () => {
    it('omits blank fields so DB defaults / autoincrement apply', () =>
      expect(insertInto('todos')({ id: '', title: 'buy milk', done: '0' })).toBe(
        `INSERT INTO "todos" ("title", "done") VALUES ('buy milk', 0)`,
      ));
    it('escapes values', () =>
      expect(insertInto('t')({ name: "O'Brien" })).toBe(
        `INSERT INTO "t" ("name") VALUES ('O''Brien')`,
      ));
    it('is curried — one table, many rows', () => {
      const into = insertInto('logs');
      expect(into({ msg: 'a' })).toBe(`INSERT INTO "logs" ("msg") VALUES ('a')`);
      expect(into({ msg: 'b' })).toBe(`INSERT INTO "logs" ("msg") VALUES ('b')`);
    });
  });

  describe('updateRow', () => {
    it('sets non-pk columns and keys on the pk (pk never in SET)', () =>
      expect(updateRow('todos')('id')('7')({ id: '7', title: 'x', done: '1' })).toBe(
        `UPDATE "todos" SET "title" = 'x', "done" = 1 WHERE "id" = 7`,
      ));
    it('is curried all the way down — reuse table+pk', () => {
      const setById = updateRow('t')('id');
      expect(setById('1')({ a: 'x' })).toBe(`UPDATE "t" SET "a" = 'x' WHERE "id" = 1`);
      expect(setById('2')({ a: 'y' })).toBe(`UPDATE "t" SET "a" = 'y' WHERE "id" = 2`);
    });
  });

  describe('deleteRow', () => {
    it('deletes by pk', () =>
      expect(deleteRow('todos')('id')('9')).toBe(`DELETE FROM "todos" WHERE "id" = 9`));
    it('escapes a string pk', () =>
      expect(deleteRow('t')('slug')("a'b")).toBe(`DELETE FROM "t" WHERE "slug" = 'a''b'`));
  });

  describe('composition (Pike-simple call sites)', () => {
    it('a full edit flow is just function application', () => {
      const table = 'todos';
      const create = insertInto(table);
      const edit = updateRow(table)('id');
      const remove = deleteRow(table)('id');
      expect(create({ title: 'ship it' })).toContain('INSERT INTO "todos"');
      expect(edit('3')({ title: 'shipped' })).toContain('WHERE "id" = 3');
      expect(remove('3')).toBe('DELETE FROM "todos" WHERE "id" = 3');
    });
  });
});
