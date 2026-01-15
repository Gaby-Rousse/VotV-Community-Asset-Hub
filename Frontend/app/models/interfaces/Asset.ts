import TypeEnum from '../enums/TypeEnum';
import type ItemEnum from "~/models/enums/ItemEnum";

export default interface Asset {
    id: number;
    ownerId: number;
    authorId: number;
    name: string;
    filename: string;
    item: ItemEnum;
    description?: string;
    thumbnail?: string;
    source?: string;
    tags?: string[];
    type?: TypeEnum;
}
