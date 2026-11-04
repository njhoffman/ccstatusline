import {
    describe,
    expect,
    it
} from 'vitest';

import { moveItem } from '../move-item';

describe('moveItem', () => {
    it('swaps with a neighbour', () => {
        expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
        expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b']);
    });

    it('takes an item past either end to the other end, keeping the rest in order', () => {
        expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
        expect(moveItem(['a', 'b', 'c', 'd'], 0, 3)).toEqual(['b', 'c', 'd', 'a']);
    });

    it('leaves the original array alone', () => {
        const items = ['a', 'b'];
        moveItem(items, 0, 1);
        expect(items).toEqual(['a', 'b']);
    });

    it('changes nothing when the source index is out of range', () => {
        expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    });
});
