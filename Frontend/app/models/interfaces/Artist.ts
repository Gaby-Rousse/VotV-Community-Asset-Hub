export default interface Artist {
    id: number;
    ownerId: string;
    name: string;
    description?: string;
    socials?: string[];
    pfp?: string;
    pfpUrl?: string;
}
