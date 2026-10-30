export interface Info
{
    totalCount: number;
    totalPages: number;
    ratingsCount?: {g: number, q: number, e: number};
}

export const defaultInfo: Info = {
    totalCount: 0,
    totalPages: 0
}