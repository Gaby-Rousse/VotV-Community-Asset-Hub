import type ItemEnum from "~/models/enums/ItemEnum";
import type TypeEnum from "~/models/enums/TypeEnum";

export default interface SimplifiedAsset {
    id: number;
    name: string;
    artistName?: string;
    size: string;
    createdAt?: string;
    thumbnailUrl: string;
    item: ItemEnum;
    type: TypeEnum;
}