/**
 * The composer's chrome: what it shows, and what it sends.
 *
 * Four laws that all look like decoration and are not.
 *
 * SEND ENABLES ON THE FIRST KEYSTROKE, in the same tick. Nothing here debounces,
 * and nothing may: a send that lights up a frame late reads as a dead button on
 * the one gesture the whole product depends on. Asserted with no `waitFor`, so a
 * deferral of ANY size fails rather than being waited out.
 *
 * THERE IS NO BASE CONTROL. Base is on for every build now (`start()` writes the
 * flag and the starter it lays down is already wired to it), and a toggle for
 * something that is always on is a question with one answer.
 *
 * THE MODE LABEL ALTERNATES, AND THE VALUE DOES NOT. `mode` rides
 * `onSubmit(text, mode)` and `localStorage.initialMode`; the loop moves the
 * LABEL. Cycling the value instead would make two identical actions build two
 * different things depending on when they landed. The label is only allowed to
 * differ from the value while nobody is here, so both signs of a person — a
 * press on the control, a character in the field — put it back.
 *
 * THE DROP RING IS ON THE OUTER HOST. Inside, it lands on the
 * `[data-field-box]`, whose `:focus-within` rule is (0,2,1) against the (0,1,0)
 * atomic class a gui `outlineWidth` compiles to — so a composer someone had
 * typed in showed the same 1px solid edge over a file as at rest, measured at
 * 390 and 1280, while an untouched one dashed correctly. The affordance was
 * absent exactly when a file is most likely to arrive.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const capture = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@hanzo/event/react', () => ({
  ...jest.requireActual('@hanzo/event/react'),
  useAnalytics: () => ({ capture }),
}));

jest.mock('@hanzo/event', () => ({
  EVENTS: { BUILD_STARTED: 'build_started' },
}));

import { BuildComposer } from '@/components/build-composer';
import { STARTER } from '@/lib/dev/starter';
import { loadWorkspace, UNTITLED } from '@/lib/dev/workspace';

import { WithGui } from '../gui-wrapper';

const renderComposer = (ui: React.ReactElement) => render(ui, { wrapper: WithGui });

/** gui renders a div[role=button]; `disabled` shows as aria-disabled. */
const send = () => screen.getByRole('button', { name: /Start building|^Build a/ });
// By NAME, which states the mode, not by the label, which alternates while the
// page idles. The assertions below still read the label — that is the thing
// under test — but finding the control by it made every one of them depend on
// which half of the animation was showing.
const modeControl = () => screen.getByRole('button', { name: /^Mode:/ });

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('send', () => {
  it('is enabled by the FIRST character, in the same tick', () => {
    renderComposer(<BuildComposer onSubmit={jest.fn()} />);
    expect(send()).toHaveAttribute('aria-disabled', 'true');

    fireEvent.change(screen.getByLabelText('Ask Hanzo to build'), { target: { value: 'a' } });

    // No waitFor, no timer advance: whatever the composer does with a keystroke
    // it does now, or this fails.
    expect(send()).not.toHaveAttribute('aria-disabled');
  });

  it('refuses a draft of nothing but spaces — it would submit nothing', () => {
    renderComposer(<BuildComposer onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Ask Hanzo to build'), { target: { value: '   ' } });
    expect(send()).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('the action row', () => {
  it('offers add, mode, voice and send — and no Base control', () => {
    renderComposer(<BuildComposer onSubmit={jest.fn()} />);
    const row = send().closest('.hz-dense') as HTMLElement;

    expect(row).toBeTruthy();
    expect(row).toContainElement(screen.getByRole('button', { name: 'Add to this build' }));
    expect(row).toContainElement(modeControl());
    expect(row.querySelector('.voice-control')).toBeTruthy();
    // Not "no button named Base" — no Base anything: the toggle carried both a
    // label and a tooltip, and a row that still had either would still offer a
    // choice that no longer exists. (The mic legitimately keeps an
    // `aria-pressed`, so that is not the tell.)
    expect(row.textContent).not.toContain('Base');
    expect(row.querySelector('[title*="Base"]')).toBeNull();
  });

  it('still seeds a build with the data plane ON', () => {
    renderComposer(<BuildComposer />);
    fireEvent.change(screen.getByLabelText('Ask Hanzo to build'), { target: { value: 'a chess club' } });
    fireEvent.click(send());

    expect(window.localStorage.getItem('initialBase')).toBe('1');
    expect(loadWorkspace(UNTITLED)?.pages).toEqual(STARTER);
    expect(window.localStorage.getItem('initialPrompt')).toBe('a chess club');
    expect(capture).toHaveBeenCalledWith('build_started', { mode: 'build', withBase: true });
  });
});

describe('the drop affordance', () => {
  /** A drag carrying files, in the shape the handlers read. */
  const files = { types: ['Files'], files: [new File(['# brief'], 'brief.md', { type: 'text/markdown' })] };

  it('rings the outer host on dragover, and never the box that lights up on focus', () => {
    const { container } = renderComposer(<BuildComposer onSubmit={jest.fn()} />);
    const host = container.querySelector('.hz-composer') as HTMLElement;
    const panel = container.querySelector('[data-field-box]') as HTMLElement;

    // gui compiles a style prop to an atomic class, so the class list IS the
    // declaration — which is also why it loses to a stylesheet rule.
    expect(host.className).toContain('_outlineWidth-0px');

    fireEvent.dragEnter(host, { dataTransfer: files });
    expect(host.className).toContain('_outlineWidth-2px');
    expect(host.className).toContain('_outlineStyle-dashed');
    // Not "the panel has a different outline" — it declares none at all, so
    // there is nothing for the focus rule to overrule.
    expect(panel.className).not.toMatch(/_outline/);

    fireEvent.drop(host, { dataTransfer: files });
    expect(host.className).toContain('_outlineWidth-0px');
    expect(screen.getByRole('button', { name: 'Remove brief.md' })).toBeInTheDocument();
  });

  it('names the rule that made the outer host necessary', () => {
    // If this ever leaves globals.css the ring could come back inside; until
    // then a prop on that element cannot win, and nothing else records it.
    const css = readFileSync(join(__dirname, '../../assets/globals.css'), 'utf8');
    const at = css.indexOf('html:root [data-field-box]:focus-within');
    expect(at).toBeGreaterThan(-1);
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/outline:\s*1px solid/);
  });
});

describe('the mode label while nobody is here', () => {
  const idle = () => <BuildComposer typewriter={['a test app']} onSubmit={jest.fn()} />;

  it('alternates, so both modes are seen without opening the menu', () => {
    jest.useFakeTimers();
    try {
      renderComposer(idle());
      expect(modeControl()).toHaveTextContent('Build');

      act(() => void jest.advanceTimersByTime(4000));
      expect(modeControl()).toHaveTextContent('Plan');

      act(() => void jest.advanceTimersByTime(4000));
      expect(modeControl()).toHaveTextContent('Build');
    } finally {
      jest.useRealTimers();
    }
  });

  it('holds still under prefers-reduced-motion', () => {
    const real = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: true, media: q })) as unknown as typeof window.matchMedia;
    jest.useFakeTimers();
    try {
      renderComposer(idle());
      act(() => void jest.advanceTimersByTime(20000));
      expect(modeControl()).toHaveTextContent('Build');
    } finally {
      jest.useRealTimers();
      window.matchMedia = real;
    }
  });

  it('stops for good the moment the control is touched, and shows the real mode', () => {
    jest.useFakeTimers();
    try {
      renderComposer(idle());
      act(() => void jest.advanceTimersByTime(4000));
      expect(modeControl()).toHaveTextContent('Plan');

      // A reach for the control — tabbing to it counts, and it is the reach
      // jsdom can express (a real pointerdown opens the gui menu, which needs a
      // PointerEvent this environment does not have). The label snaps back to
      // the value a submit would send, which is what makes the two safe to
      // differ at all.
      fireEvent.focus(modeControl());
      expect(modeControl()).toHaveTextContent('Build');

      act(() => void jest.advanceTimersByTime(20000));
      expect(modeControl()).toHaveTextContent('Build');
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops when a draft is typed — the label a submit is sent under is the truth', () => {
    jest.useFakeTimers();
    try {
      renderComposer(idle());
      act(() => void jest.advanceTimersByTime(4000));
      expect(modeControl()).toHaveTextContent('Plan');

      fireEvent.change(screen.getByLabelText('Ask Hanzo to build'), { target: { value: 'a' } });
      expect(modeControl()).toHaveTextContent('Build');

      act(() => void jest.advanceTimersByTime(20000));
      expect(modeControl()).toHaveTextContent('Build');
    } finally {
      jest.useRealTimers();
    }
  });

  it('cannot submit at all while the animation is the only thing in the box', () => {
    // There was exactly ONE moment the label and the submitted value could
    // differ: a send on an empty composer used to build whatever phrase the
    // typewriter was showing, which submits without a keystroke and so leaves
    // the composer idle and the mode loop running — a "Plan" label over a
    // `build` submit. That is gone; send now builds what was written.
    //
    // So the divergence is no longer a value to check, it is a state to make
    // UNREACHABLE, and this pins the reason it is: the loop runs only while the
    // box is empty, and while the box is empty there is nothing to send. The
    // three tests above cover the other direction — every way of putting
    // something in the box stops the loop first.
    //
    // The phrase is long enough to finish typing after the first flip, which is
    // where the old code armed and where a re-armed one would arm again.
    const LONG =
      'a customer portal with login, a dashboard, billing, invoices, and an admin area for the whole team to use';
    const typedOut = 400 + 38 * LONG.length; // the typewriter's own lead + cadence
    expect(typedOut).toBeGreaterThan(4000); // …lands after the label reads Plan
    expect(typedOut).toBeLessThan(8000); // …and before it reads Build again

    const onSubmit = jest.fn();
    jest.useFakeTimers();
    try {
      renderComposer(<BuildComposer typewriter={[LONG]} onSubmit={onSubmit} />);
      act(() => void jest.advanceTimersByTime(typedOut + 100));

      // The whole example is typed out and the label has flipped — the exact
      // state the old bug submitted from.
      expect(screen.getByLabelText('Ask Hanzo to build')).toHaveAttribute(
        'placeholder',
        `Ask Hanzo to build ${LONG}█`,
      );
      expect(modeControl()).toHaveTextContent('Plan');

      // TWO assertions, because they cover two different readers, and neither
      // one alone would have caught the bug.
      //
      // `aria-disabled`, not `toBeDisabled()`: a gui Button compiles `disabled`
      // to that attribute plus `pointer-events: none` and half opacity, and
      // never to the native attribute — so the matcher that reads the DOM one
      // reports "not disabled" on a button that plainly is. It is what a screen
      // reader is told.
      expect(send()).toHaveAttribute('aria-disabled', 'true');

      // And it stays silent when activated anyway, which is not belt-and-braces:
      // `pointer-events: none` stops a pointer and nothing else, and with no
      // native attribute the control keeps `tabindex="0"`, so Enter on it still
      // fires a click. What refuses that is `submit`'s own `if (!text) return`.
      // This is the assertion a re-armed handler fails.
      fireEvent.click(send());
      expect(onSubmit).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
