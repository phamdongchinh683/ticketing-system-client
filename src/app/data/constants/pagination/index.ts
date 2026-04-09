export const PAGE_LIMITS = [10, 20, 50, 100];
export type PageLimit = (typeof PAGE_LIMITS)[number];
export const DEFAULT_PAGE_LIMIT: PageLimit = 10;
