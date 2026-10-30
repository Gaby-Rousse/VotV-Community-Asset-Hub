import React, {useEffect, useState} from "react";
import type Asset from "~/models/interfaces/Asset";
import {useAuth} from "~/context/AuthContext";
import {useLoading} from "~/context/LoadingContext";
import {humanDate} from "../Functions";
import {downloadCollection, fetchTag} from "~/api/tags";
import type Tag from "~/models/interfaces/Tag";
import AssetDetailModal from "~/components/assets/AssetDetailModal";
import SimpleBar from "simplebar-react";
import {apiCall} from "~/components/Functions";
import {filtersToParams} from "~/helpers/filterParams";
import {defaultFilters} from "~/models/interfaces/Filters";
import ItemEnum from "~/models/enums/ItemEnum";
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";
import RatingCheckboxInput from "~/components/other/RatingCheckboxInput";

export default function TagDetailModal({id, setId, assetId, setAssetId, setIsNavigating, setSelectedTag, setSelectedAsset}: {
    id: number,
    setId: (value: number) => void,
    assetId: number,
    setAssetId: (value: number) => void,
    setIsNavigating: (value: boolean) => void
    setSelectedTag: (tag: Tag) => void,
    setSelectedAsset: (asset: Asset) => void,
}) {
    const [tag, setTag] = useState<Tag | null>();
    const {isAuthenticated, isAdmin} = useAuth();
    const {setIsLoading} = useLoading();
    const [trigger, setTrigger] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);

    const [assets, setAssets] = useState<Asset[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [ratingsCount, setRatingsCount] = useState<{g: number, q: number, e: number}>();

    const [ratings, setRatings] = useState<ContentRatingEnum[]>([ContentRatingEnum.General])
    const [downloadCount, setDownloadCount] = useState(0);

    useEffect(() => {
        if (!tag) return;
        const params = filtersToParams({...defaultFilters, tags: [tag.name], page, ratings});
        apiCall(`/api/Assets?${params}`, null)
            .then(res => res.json())
            .then(response => {
                setAssets(response.data);
                setTotalPages(response.totalPages);
                setRatingsCount(response.ratingsCount);
            })
            .catch(err => console.error(err));
    }, [tag?.name, page, trigger, ratings]);

    useEffect(() => {
        if(ratingsCount == undefined)
            return;
        let count = 0;

        if(ratings.includes(ContentRatingEnum.General))
        {
            count += ratingsCount.g ?? 0
        }
        if(ratings.includes(ContentRatingEnum.Questionable))
        {
            count += ratingsCount.q ?? 0
        }
        if(ratings.includes(ContentRatingEnum.Explicit))
        {
            count += ratingsCount.e ?? 0
        }

        setDownloadCount(count);
    }, [ratingsCount]);


    function copyToClipBoard(value: string) {
        try {
            navigator.clipboard.writeText(value);
        }
        catch (error)
        {

        }
        setCopied(true);
    }

    useEffect(() => {
        setIsLoading(true);
        fetchTag(id)
            .then(tag => {
                setTag(tag);
                console.log(tag)
            })
            .catch(err => console.error(err)).finally(() => setIsLoading(false));
    }, [id, trigger]);

    if (!tag) {
        return (
            <div className="fixed flex w-full h-full top-0 left-0 bg-black/50 z-10">
                <div className="dos m-auto">Loading...</div>
            </div>
        );
    }


    return (
        <>
            {assetId != 0 ? (<AssetDetailModal id={assetId} setId={setAssetId} setSelectedAsset={setSelectedAsset}
                                               setIsNavigating={setIsNavigating} setTrigger={setTrigger}/>) : ("")}
            <div className="fixed flex flex-col inset-0 pb-8 bg-black/50 z-10">
                <div className="flex flex-col m-auto w-full h-full 2xl:w-2/3 2xl:h-4/5 bg-black border-2 overflow-hidden">

                    <div className="flex shrink-0 gap-2 h-12 border-b-2 flex-row">
                        <div className="dos line-clamp-1 ml-2 text-2xl my-auto">{tag?.name}</div>
                        <div className="flex flex-row ml-auto">
                            <div className="flex flex-row items-center dos ml-auto">
                                <button className="px-2" onClick={() => setPage(p => Math.max(1, p - 1))}>&lt;</button>
                                <div>{page} / {totalPages}</div>
                                <button className="px-2" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&gt;</button>
                            </div>

                            <div className="my-auto mr-1"><RatingCheckboxInput oldValue={ratings} setReaderValue={setRatings} ratingsCount={ratingsCount}/></div>

                                <button onClick={() => copyToClipBoard(window.location.href)}
                                        className="dos shrink-0 border hover:cursor-pointer size-8 my-auto m-1"
                                        type="button">
                                    <img src={copied ? "https://votvbroadcast.com/images/check.png" : "https://votvbroadcast.com/images/share.png"}/>
                                </button>
                                <button onClick={() => setId(0)}
                                        className="dos shrink-0 border hover:cursor-pointer size-8 my-auto m-1"
                                        type="button">
                                    <img src="https://votvbroadcast.com/images/cross.png"/>
                                </button>

                        </div>
                    </div>

                    <SimpleBar className="flex-1 min-h-0">
                        <div className="flex justify-center items-start flex-wrap gap-3 p-3">
                            {assets.map((a) => (
                                <div onClick={() => setAssetId(a.id)} className="flex hover:cursor-pointer flex-col"
                                     key={a.id}>
                                    <div className={`mx-auto h-50 aspect-square border relative ${a.item == ItemEnum.Poster && "poster-bg"}`}>
                                        <img loading="lazy" className="absolute object-contain mx-auto w-full h-full"
                                             alt="thumbnail" src={a.thumbnailUrl ?? ""}/>
                                        <div className="absolute px-1 top-0 h-10 w-full flex items-center flex-col bg-black/50">
                                            <div className="dos line-clamp-1 my-auto text-center">{a.name}</div>
                                        </div>
                                        <div className="absolute px-1 bottom-0 h-20 w-full flex flex-col bg-black/50">
                                            <div className="dos truncate">By: {a.artistName}</div>
                                            <div className="dos">Size: {a.size ?? "N/A"}</div>
                                            <div className="dos text-center mt-auto">{humanDate(a.createdAt ?? "")}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SimpleBar>

                    <div className="shrink-0 z-10 border-t">
                        <div className="flex flex-col p-1 h-24 border-b">
                            <div className="dos shrink-0">Description:</div>
                            <div className="dos overflow-y-auto flex-1 min-h-0">
                                {tag?.description ?? "No description available"}
                            </div>
                        </div>
                        <div className="flex flex-row gap-1 py-2 mx-auto w-fit sm:w-auto sm:justify-end sm:pr-1">
                            {isAuthenticated && isAdmin && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    fetchTag(tag?.id ?? 0).then(data => {
                                        setSelectedTag(data);
                                        setIsNavigating(false);
                                    });
                                }}
                                        className="dos shrink-0 border hover:cursor-pointer my-auto">
                                    <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                        <img className="size-7" src="https://votvbroadcast.com/images/pencil.png"/>
                                        <div className="dos my-auto">Edit</div>
                                    </div>
                                </button>
                            )}
                            <button disabled={downloadCount == 0} onClick={() => downloadCollection(tag!.id, ratings)}
                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                    <img className="size-7" src="https://votvbroadcast.com/images/download.png"/>
                                    <div className="dos my-auto">Download ({downloadCount})</div>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}