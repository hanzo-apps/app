/**
 * Where the injected widget's bytes live, for the suites that assert on them.
 *
 * It used to be `public/edit.js` in this repo, and five suites each opened that
 * path directly. The widget moved to `@hanzo/control` and is copied into
 * `public/control.js` on install — so all five broke at once with an ENOENT
 * that names a file, not a cause, and main went red on a rename that touched
 * none of them.
 *
 * The PACKAGE is read rather than `public/control.js`, because the copy is a
 * build artifact: it exists after `postinstall` and not in a clean checkout, so
 * a suite reading it fails for a reason that has nothing to do with the widget.
 * The package is a declared dependency and is always there.
 *
 * This app no longer OWNS the widget, so an invariant that belongs to the widget
 * itself belongs in hanzoai/control. What stays here is what THIS app depends on
 * being true of the bytes it serves.
 */
import fs from 'node:fs';
import path from 'node:path';

export const WIDGET_PATH = path.join(
  process.cwd(),
  'node_modules/@hanzo/control/src/control.js',
);

export const widget = (): string => fs.readFileSync(WIDGET_PATH, 'utf8');

/**
 * The widget with comments removed, for a check that a VALUE is not restated.
 * A comment explaining why something is not copied necessarily names the thing,
 * and a scan that reads its own rationale as the violation fails on the fix.
 */
export const widgetCode = (): string =>
  widget()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
