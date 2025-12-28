export const LANGUAGE = ['KO', 'EN'] as const;
export type Language = (typeof LANGUAGE)[number];

export const DEFAULT_LANGUAGE: Language = 'KO';
