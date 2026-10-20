import { z } from 'zod';

export const WidgetStyleSchema = z.enum([
    'minimal',
    'pure',
    'slashed',
    'classic',
    'bubble',
    'rainbow'
]);

export type WidgetStyleName = z.infer<typeof WidgetStyleSchema>;