import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Textarea } from '@hanzo/ui';
import { GuiProvider } from '@hanzo/gui';

import { guiConfig } from '@/lib/gui';

/**
 * Which spelling of "the text changed" actually fires.
 *
 * This matters far out of proportion to its size. 70 call sites in this app
 * write `onChange={(e) => …e.target.value}` on a `@hanzo/ui` field, and the
 * repo's own notes said that spelling "never fired" and was dead code. If that
 * were still true, 70 fields would be silently unresponsive — you would type
 * and nothing would happen — and the fix would be a 70-file sweep.
 *
 * It is NOT true at @hanzo/ui 8.0.69: both spellings fire, measured below.
 * `@hanzo/gui`'s field renders a real `<input>`/`<textarea>` on web and
 * forwards the DOM handler. The note was written against an earlier version and
 * rotted; the sweep it implies would have been pure churn.
 *
 * The test stays because the FAILURE is invisible. A gui bump that stopped
 * forwarding `onChange` would not break the build, would not raise a type
 * error, and would not throw at runtime — 70 fields would just quietly stop
 * accepting input. This turns that into a red test.
 *
 * House style is still `onChangeText`: it is the native spelling, it hands you
 * the string instead of an event to dig through, and it is what the newer code
 * uses. That is a preference, not a bug report — do not sweep the 70.
 */
function field(ui: React.ReactElement) {
  return render(
    <GuiProvider config={guiConfig} defaultTheme="dark">
      {ui}
    </GuiProvider>,
  );
}

describe('a @hanzo/ui field reports its own changes', () => {
  it('Input fires BOTH onChange and onChangeText', () => {
    const onChange = jest.fn();
    const onChangeText = jest.fn();
    field(<Input aria-label="one" onChange={onChange} onChangeText={onChangeText} />);
    fireEvent.change(screen.getByLabelText('one'), { target: { value: 'hello' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenCalledTimes(1);
    // The two carry the same text by different routes — the string directly,
    // or the event whose target holds it.
    expect(onChangeText).toHaveBeenCalledWith('hello');
    expect(onChange.mock.calls[0][0]?.target?.value).toBe('hello');
  });

  it('Textarea fires BOTH as well', () => {
    const onChange = jest.fn();
    const onChangeText = jest.fn();
    field(<Textarea aria-label="two" onChange={onChange} onChangeText={onChangeText} />);
    fireEvent.change(screen.getByLabelText('two'), { target: { value: 'body' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenCalledWith('body');
  });
});
