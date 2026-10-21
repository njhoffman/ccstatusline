import {
    describe,
    expect,
    it
} from 'vitest';

import {
    getPlainInput,
    shouldInsertInput,
    withVimArrows
} from '../input-guards';

describe('getPlainInput', () => {
    it('passes bare keypresses through, shifted ones included', () => {
        expect(getPlainInput('d', {})).toBe('d');
        expect(getPlainInput('D', { shift: true })).toBe('D');
        expect(getPlainInput(' ', {})).toBe(' ');
    });

    it('hides the letter while ctrl or alt/option (meta) is held', () => {
        expect(getPlainInput('d', { ctrl: true })).toBe('');
        expect(getPlainInput('d', { meta: true })).toBe('');
        expect(getPlainInput('d', { ctrl: true, meta: true })).toBe('');
    });
});

describe('shouldInsertInput', () => {
    it('allows regular printable input without modifiers', () => {
        expect(shouldInsertInput('s', {})).toBe(true);
        expect(shouldInsertInput('S', { shift: true })).toBe(true);
    });

    it('blocks ctrl chords', () => {
        expect(shouldInsertInput('s', { ctrl: true })).toBe(false);
    });

    it('blocks meta chords', () => {
        expect(shouldInsertInput('s', { meta: true })).toBe(false);
    });

    it('blocks tab-based input', () => {
        expect(shouldInsertInput('\t', { tab: true })).toBe(false);
    });

    it('blocks control characters and allows unicode text', () => {
        expect(shouldInsertInput('\u0013', {})).toBe(false);
        expect(shouldInsertInput('🙂', {})).toBe(true);
    });
});

describe('withVimArrows', () => {
    it.each([
        ['j', 'downArrow'],
        ['k', 'upArrow'],
        ['h', 'leftArrow'],
        ['l', 'rightArrow']
    ])('maps %s to %s', (input, arrow) => {
        expect(withVimArrows(input, {})).toEqual({ [arrow]: true });
    });

    it('maps only j/k on the vertical axis', () => {
        expect(withVimArrows('j', {}, 'vertical')).toEqual({ downArrow: true });
        expect(withVimArrows('h', {}, 'vertical')).toEqual({});
        expect(withVimArrows('l', {}, 'vertical')).toEqual({});
    });

    it('ignores uppercase, other letters, and ctrl or meta combos', () => {
        expect(withVimArrows('J', { shift: true })).toEqual({ shift: true });
        expect(withVimArrows('x', {})).toEqual({});
        expect(withVimArrows('j', { ctrl: true })).toEqual({ ctrl: true });
        expect(withVimArrows('k', { meta: true })).toEqual({ meta: true });
    });

    it('keeps the other key flags and leaves the original key untouched', () => {
        const key = { tab: false, upArrow: false };
        expect(withVimArrows('k', key)).toEqual({ tab: false, upArrow: true });
        expect(key.upArrow).toBe(false);
    });
});
