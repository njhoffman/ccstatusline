export interface InputKeyLike {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    tab?: boolean;
}

const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/u;

// Letter shortcuts compare against this rather than the raw input, so ctrl and
// alt/option combos never trigger the plain-letter action (macOS terminals send
// alt+← as ESC b, i.e. meta+b) and stay free for bindings of their own
export function getPlainInput(input: string, key: InputKeyLike): string {
    return key.ctrl || key.meta ? '' : input;
}

export interface ArrowKeyLike {
    upArrow?: boolean;
    downArrow?: boolean;
    leftArrow?: boolean;
    rightArrow?: boolean;
}

const VIM_ARROWS: Record<string, keyof ArrowKeyLike> = {
    j: 'downArrow',
    k: 'upArrow',
    h: 'leftArrow',
    l: 'rightArrow'
};

// Treats vim's j/k (and h/l unless only the vertical axis is requested) as the
// matching arrow key. Call it only where the screen is navigating, never while
// a text field has focus, so the letters still type there
export function withVimArrows<K extends InputKeyLike & ArrowKeyLike>(input: string, key: K, axes: 'all' | 'vertical' = 'all'): K {
    const arrow = VIM_ARROWS[getPlainInput(input, key)];
    if (!arrow || (axes === 'vertical' && (arrow === 'leftArrow' || arrow === 'rightArrow'))) {
        return key;
    }
    return { ...key, [arrow]: true };
}

export const shouldInsertInput = (input: string, key: InputKeyLike): boolean => {
    if (!input) {
        return false;
    }

    if (key.ctrl || key.meta || key.tab) {
        return false;
    }

    return !CONTROL_CHAR_REGEX.test(input);
};
