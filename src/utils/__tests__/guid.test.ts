import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { generateGuid } from '../guid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateGuid', () => {
    it('produces UUID v4 ids', () => {
        for (let run = 0; run < 100; run++) {
            expect(generateGuid()).toMatch(UUID_V4);
        }
    });

    it('stays in format at both ends of the random range', () => {
        const random = vi.spyOn(Math, 'random');
        try {
            random.mockReturnValue(0);
            expect(generateGuid()).toMatch(UUID_V4);
            random.mockReturnValue(0.999999);
            expect(generateGuid()).toMatch(UUID_V4);
        } finally {
            random.mockRestore();
        }
    });

    it('does not repeat', () => {
        const ids = new Set(Array.from({ length: 1000 }, () => generateGuid()));
        expect(ids.size).toBe(1000);
    });
});
