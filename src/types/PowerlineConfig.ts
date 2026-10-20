import { z } from 'zod';

// Schema for segment caps (per-widget caps, used by bubble style)
export const SegmentCapsSchema = z.object({
    start: z.string(),
    end: z.string(),
    gap: z.string()
});

// Schema for powerline configuration
export const PowerlineConfigSchema = z.object({
    enabled: z.boolean().default(false),
    separators: z.array(z.string()).default(['\uE0B0']),
    separatorInvertBackground: z.array(z.boolean()).default([false]),
    startCaps: z.array(z.string()).default([]),
    endCaps: z.array(z.string()).default([]),
    theme: z.string().optional(),
    autoAlign: z.boolean().default(false),
    continueThemeAcrossLines: z.boolean().default(false),
    segmentCaps: SegmentCapsSchema.optional()
});

// Inferred type from schema
export type PowerlineConfig = z.infer<typeof PowerlineConfigSchema>;
