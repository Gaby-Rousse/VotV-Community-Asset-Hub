import TypeEnum from '../enums/TypeEnum';
import type ItemEnum from "~/models/enums/ItemEnum";
import type Artist from "~/models/interfaces/Artist";

export default interface Asset {
    id: number;
    ownerId: string;
    name: string;
    filename: string;
    item: ItemEnum;
    description?: string;
    thumbnail?: string;
    source?: string;
    tags?: string[];
    type?: TypeEnum;
    thumbnailUrl?: string;
    fileUrl?: string;
    artistName?: string;
    createdAt?: string;
    preview?: string;
    previewUrl?: string;
    size?: string;
    artist: Artist;
}
