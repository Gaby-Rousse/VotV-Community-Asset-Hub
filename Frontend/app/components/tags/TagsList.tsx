import type Tag from "~/models/interfaces/Tag";
import type Asset from "~/models/interfaces/Asset";
import {useAuth} from "~/context/AuthContext";
import {useLoading} from "~/context/LoadingContext";
import React, {useEffect, useState} from "react";
import {defaultInfo, type Info} from "~/models/interfaces/Info";
import {defaultFilters, defaultTagFilters, type Filters, SortBy} from "~/models/interfaces/Filters";
import {apiCall} from "~/components/Functions";
import TagDetailModal from "~/components/tags/TagDetailModal";
import {useSearchParams} from "react-router";
import {filtersToParams, paramsToFilters} from "~/helpers/filterParams";
import SimpleBar from "simplebar-react";

export default function ListCollections(
    { setSelectedTag, setSelectedAsset, setIsNavigating }:
    { setSelectedTag: (tag: Tag) => void; setSelectedAsset: (asset: Asset) => void; setIsNavigating: (value: boolean) => void; }
) {

    const {id} = useAuth();
    const [searchParams, setSearchParams] = useSearchParams()
    const {setIsLoading} = useLoading();
    const [tags, setTags] = useState<Tag[]>([]);
    const [info, setInfo] = useState<Info>(defaultInfo);
    const [filters, setFilters] = useState<Filters>(() => ({
        ...paramsToFilters(searchParams, defaultTagFilters),
        item: null,
    }));
    const [menuOpened, setMenuOpened] = useState(false);
    const [timeTaken, setTimeTaken] = useState<number>();
    const [display, setDisplay] = useState<number>(0);

    const [tagId, setTagId] = useState<number>(parseInt(searchParams.get("tagId") ?? "0"));
    const [assetId, setAssetId] = useState<number>(parseInt(searchParams.get("assetId") ?? "0"));

    useEffect(() => {
        const params = filtersToParams(filters, defaultTagFilters);
        params.set("view", "collections");
        if (tagId > 0) params.set("tagId", String(tagId));
        if (tagId > 0 && assetId > 0) params.set("assetId", String(assetId));
        setSearchParams(params, { replace: true });
    }, [filters, tagId, assetId]);

    useEffect(() => {
        const delay = filters.search !== "" ? 300 : 0;

        const timeout = setTimeout(() => {
            let start = performance.now();
            setIsLoading(true);
            const url = `/api/Tags?${filtersToParams(filters).toString()}`;
            apiCall(url, null).then(res => res.json())
                .then(response => {
                    setTags(response.data);
                    setInfo({totalCount: response.totalCount, totalPages: response.totalPages});
                    setTimeTaken(performance.now() - start);
                })
                .catch(err => console.error('Failed to fetch tags:', err))
                .finally(() => setIsLoading(false));
        }, delay);

        return () => clearTimeout(timeout);
    }, [filters]);

    return <>

        {tagId > 0 && <TagDetailModal id={tagId} setId={setTagId} assetId={assetId} setAssetId={setAssetId} setIsNavigating={setIsNavigating} setSelectedTag={setSelectedTag} setSelectedAsset={setSelectedAsset}/>}

        <div
        className={`dos border absolute z-10 transition-all bg-black left-0 ${menuOpened ? ("h-60") : ("h-8")} bottom-0 flex flex-col w-full`}>
        <div onClick={() => setMenuOpened(!menuOpened)}
             className="flex flex-row h-8 w-full px-6 hover:cursor-pointer border-b items-center">
            <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
            <div className="mx-auto dos">Advanced Search</div>
            <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
        </div>
        {menuOpened && (<div className="p-2 flex gap-1 flex-col">
            <div>Time taken to fetch tags: {timeTaken} ms</div>
            <div>Tags found: {info.totalCount}</div>
            <div className="flex flex-row items-center gap-1">
                <div>Display:</div>
                <button onClick={() => setDisplay(display)}
                        className={`border opacity-50 ${display == 2 && ("selected")} w-28 p-1`}>Posts
                </button>
                <button onClick={() => setDisplay(0)}
                        className={`border ${display == 0 && ("selected")} w-28 p-1`}>Thumbnails
                </button>
                <button onClick={() => setDisplay(1)}
                        className={`border ${display == 1 && ("selected")} w-28 p-1`}>List
                </button>
            </div>
            <div className="flex flex-row mt-1 items-center gap-1">
                <div>Order by:</div>
                <button onClick={() => setFilters(prevState => ({...prevState, sort: SortBy.Alphabetical}))}
                        className={`border ${filters.sort == SortBy.Alphabetical && ("selected")} w-36 p-1`}>Alphabetically
                </button>
                <button onClick={() => setFilters(prevState => ({...prevState, sort: SortBy.Count}))}
                        className={`border ${filters.sort == SortBy.Count && ("selected")} w-36 p-1`}>Count
                </button>
                <button
                    onClick={() => setFilters(prevState => ({...prevState, reverse: !prevState.reverse}))}
                    className={`border ml-5 ${filters.reverse && ("selected")} w-36 p-1`}>Reverse
                </button>
            </div>
        </div>)}
    </div><SimpleBar className="flex-1 min-h-0" >
        <div className="flex flex-col h-full" >

        <div className="flex max-w-full flex-wrap sm:flex-nowrap justify-center sm:justify-left w-full min-w-0 flex-row gap-1 mt-1 mx-0.5">
            <div className="flex flex-row items-center dos">
                <button className="px-2"
                        onClick={() => setFilters(prevState => ({
                            ...prevState,
                            page: Math.max(1, Math.min(prevState.page - 1, info.totalPages))
                        }))}>&lt;</button>
                <div className="flex flex-row">
                    <div>{filters.page}</div>
                    <div>/</div>
                    <div>{info.totalPages}</div>
                </div>
                <button className="px-2"
                        onClick={() => setFilters(prevState => ({
                            ...prevState,
                            page: Math.max(1, Math.min(prevState.page + 1, info.totalPages))
                        }))}>&gt;</button>
            </div>
            <button onClick={() => setFilters(defaultTagFilters)}
                    className={`dos border md:whitespace-nowrap hover:cursor-pointer px-1 shrink-0`}>
                <img className="size-5" src="noFilters.png" alt="noFilters"/>
            </button>
            <input type="text"
                   value={filters.search ?? ""}
                   onChange={(e) => setFilters(prevState => ({...prevState, search: e.target.value}))}
                   className="dos text-center fucker mb-0.5 sm:m-0 border w-full"
                   placeholder="Search..."/>
        </div>
        <div className="flex justify-center items-center overflow-y-auto mt-3 mb-8.5 sm:mt-1 px-1 gap-3 flex-wrap flex-row">
            {display == 0 ? tags.map((t) => (
                <div onClick={() => setTagId(t.id)} className="flex hover:cursor-pointer flex-col" key={t.id}>
                    <div className={`mx-auto h-50 aspect-square border relative`}>
                        <img loading="lazy" className="absolute object-contain mx-auto w-full h-full"
                             alt="thumbnail" src={t.thumbnailUrl || undefined}/>
                        <div className="absolute px-1 top-0 h-10 w-full flex items-center flex-col bg-black/50">
                            <div className="dos line-clamp-1 w-9/10 my-auto text-center">{t.name}</div>
                        </div>
                        <div className="absolute px-1 bottom-0 h-10 w-full flex flex-col bg-black/50">
                            <div className="dos mx-auto">Count: {t.count ?? "N/A"}</div>
                        </div>
                    </div>
                </div>
            )) : (
                <>
                    <div className="flex dos w-full gap-4">
                        <div className="w-16 shrink-0">Thumbnail</div>
                        <div className="flex-1">Title</div>
                        <div className="hidden md:flex w-25 shrink-0">Count</div>
                    </div>
                    {tags.map((t) => (
                        <div onClick={() => setTagId(t.id)}
                             className="flex w-full items-center url dos gap-4 hover:cursor-pointer"
                             key={t.id}>
                            <img loading="lazy" className="size-12 shrink-0 object-contain"
                                 src={t.thumbnailUrl}/>
                            <div className="flex-1 min-w-0 truncate">{t.name}</div>
                            <div className="w-21 mr-10 shrink-0 text-center truncate">{t.count}</div>
                        </div>
                    ))}
                </>)}

        </div>
        </div></SimpleBar></>
}