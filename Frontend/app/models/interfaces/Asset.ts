import TypeEnum from '../enums/TypeEnum';
import type ItemEnum from "~/models/enums/ItemEnum";

export default interface Asset {
    id: number;
    ownerId: number;
    artistId: number;
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
}
