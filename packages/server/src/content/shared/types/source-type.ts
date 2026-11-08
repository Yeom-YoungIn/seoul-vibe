export const SOURCE_TYPE = ['INSTAGRAM', 'LINK'] as const;
export type SourceType = (typeof SOURCE_TYPE)[number];
