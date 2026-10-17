import type Tag from "~/models/interfaces/Tag";
import type SimplifiedAsset from "~/models/interfaces/SimplifiedAsset";

export default interface DetailedTag extends Tag {
    assets: SimplifiedAsset[];
}