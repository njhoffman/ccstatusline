import { z } from 'zod';

export const WidgetStyleSchema = z.enum([
    'classic',
    'bubble',
    'slashed',
    'minimal',
    'rainbow',
    'pure'
]);

export type WidgetStyleName = z.infer<typeof WidgetStyleSchema>;
