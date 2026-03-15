import {useEffect, useRef, useState} from "react";
import {useAuth} from "~/context/AuthContext";
import type Asset from "~/models/interfaces/Asset";
import {useLoading} from "~/context/LoadingContext";
import {apiCall, humanDate, selectAspectRatio} from "~/components/Functions";
import AssetDetailModal from "~/components/assets/AssetDetailModal";
import {useSearchParams} from "react-router";
import {defaultFilters, type Filters, SearchBy, SortBy} from "~/models/interfaces/Filters";
import {defaultInfo, type Info} from "~/models/interfaces/Info";
import {useFilters} from "~/context/FiltersContext";

export default function ListAssets({setIsNavigating, setSelectedAsset}: {
    setIsNavigating: (item: boolean) => void,
    setSelectedAsset: (value: Asset) => void,
}) {
    let [searchParams, setSearchParams] = useSearchParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [info, setInfo] = useState<Info>(defaultInfo);
    const [assetId, setAssetId] = useState(parseInt(searchParams.get("assetId") ?? "0"));
    const [trigger, setTrigger] = useState(0);
    const {isLoading, setIsLoading} = useLoading();
    const {isAuthenticated, id, isAdmin} = useAuth()
    const [menuOpened, setMenuOpened] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0.0);
    //0 thumbnail, 1 list, 2 posts
    const [display, setDisplay] = useState(0);
    const [tagQuery, setTagQuery] = useState("")
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const {filters, setFilters} = useFilters();

    function updateAssetId(assetId: number) {
        if (assetId == 0)
            setSearchParams({});
        else
            setSearchParams({assetId: assetId.toString()});
        setAssetId(assetId);
    }

    useEffect(() => {
        let start = performance.now()
        setIsLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
                params.append(key, value);
        });
        const url = `/api/Assets?${params.toString()}`;
        apiCall(url, null).then(res => res.json())
            .then(response => {
                setAssets(response.data);
                setInfo({totalCount: response.totalCount, totalPages: response.totalPages})
                setTimeTaken(performance.now() - start);
            })
            .catch(err => console.error('Failed to fetch assets:', err)).finally(() => setIsLoading(false));
    }, [trigger, filters]);

    useEffect(() => {
        setFilters(prevState => ({...prevState, page:1}))
    }, [filters.item]);

    return (
        <>
            {assetId != 0 ? (<AssetDetailModal id={assetId} setId={updateAssetId} setSelectedAsset={setSelectedAsset}
                                               setIsNavigating={setIsNavigating} setTrigger={setTrigger}/>) : ("")}

            <div className="flex max-w-full w-full min-w-0 flex-row gap-1 mt-1 mx-0.5">
                <div className="flex flex-row items-center dos">
                    <button className="px-2" onClick={() => setFilters(prevState => ({ ...prevState, page: Math.max(1, Math.min(prevState.page - 1, info.totalPages))}))}>&lt;</button>
                    <div className="flex flex-row">
                        <div>{filters.page}</div>
                        <div>/</div>
                        <div>{info.totalPages}</div>
                    </div>
                    <button className="px-2" onClick={() => setFilters(prevState => ({ ...prevState, page: Math.max(1, Math.min(prevState.page + 1, info.totalPages))}))}>&gt;</button>
                </div>
                <input type="text" onChange={(e) => setFilters(prevState => ({ ...prevState, search: e.target.value }))} className="dos text-center border w-full"
                       placeholder="Search..."/>
                <button onClick={() => setFilters(prevState => ({ ...prevState, searchBy: SearchBy.Name }))}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-2 ${filters.searchBy == SearchBy.Name ? ("selected") : ("")}`}>By
                    Title
                </button>
                <button onClick={() => setFilters(prevState => ({ ...prevState, searchBy: SearchBy.Artist }))}
                        className={`dos border mr-1 md:whitespace-nowrap hover:cursor-pointer px-2 ${filters.searchBy == SearchBy.Artist ? ("selected") : ("")}`}>By
                    Artist
                </button>
            </div>
            <div
                className="flex justify-center items-center overflow-y-auto mt-3 mb-8.5 sm:mt-1 px-1 gap-3 flex-wrap flex-row ">
                {
                    display == 0 ? (assets.map((a) => (
                        <div onClick={() => updateAssetId(a.id)} className="flex hover:cursor-pointer flex-col"
                             key={a.id}>
                            <div className={`mx-auto ${selectAspectRatio({
                                item: a.item,
                                type: a.type
                            })} border relative`}>
                                <img loading="lazy" className="absolute object-contain mx-auto w-full h-full"
                                     alt="thumbnail" src={a.thumbnailUrl ?? ""}/>
                                <div className="absolute px-1 top-0 h-10 w-full flex items-center flex-col bg-black/50">
                                    <div className="dos line-clamp-1 my-auto text-center">{a.name}</div>
                                </div>
                                <div className="absolute px-1 bottom-0 h-20 w-full flex flex-col bg-black/50">
                                    <div className="dos truncate">By: {a.artist.name} </div>
                                    <div className="dos">Size: {a.size ?? "N/A"}</div>
                                    <div className="dos text-center mt-auto">{humanDate(a.createdAt ?? "")}</div>
                                </div>
                            </div>
                        </div>
                    ))) : (
                        <>
                            <div className="flex dos w-full gap-4">
                                <div className="w-16 shrink-0">Thumbnail</div>
                                <div className="flex-1">Title</div>
                                <div className="w-30 md:w-40 lg:w-60 shrink-0">Artist</div>
                                <div className="hidden md:flex w-25 shrink-0">Created</div>
                            </div>
                            {assets.map((a) => (
                                <div onClick={() => updateAssetId(a.id)}
                                     className="flex w-full items-center url dos gap-4 hover:cursor-pointer"
                                     key={a.id}>
                                    <img loading="lazy" className="size-8 shrink-0 object-contain"
                                         src={a.thumbnailUrl}/>
                                    <div className="flex-1 min-w-0 truncate">{a.name}</div>
                                    <div className="w-30 md:w-40 lg:w-60 shrink-0 truncate">{a.artist.name}</div>
                                    <div className="hidden md:flex w-25 shrink-0">{humanDate(a.createdAt ?? "")}</div>
                                </div>
                            ))}
                        </>
                    )
                }
            </div>

            <div
                className={`dos border absolute z-10 transition-all bg-black left-0 ${menuOpened ? ("h-60") : ("h-8")} bottom-0 flex flex-col w-full`}>
                <div onClick={() => setMenuOpened(!menuOpened)}
                     className="flex flex-row h-8 w-full px-6 hover:cursor-pointer border-b items-center">
                    <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
                    <div className="mx-auto dos">Menu</div>
                    <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
                </div>
                {menuOpened && (<div className="p-2 flex gap-1 flex-col">
                    <div>Time taken to fetch assets: {timeTaken} ms</div>
                    <div>Assets found: {info.totalCount}</div>
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
                    <div className="flex gap-1 mt-1 flex-row">
                        <div className="text-nowrap">Tags filter:</div>
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={tagQuery}/*
                                onChange={handleTagInput}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                */
                                className="dos text-center border w-full"
                                placeholder="Tags (separated by spaces)"/>
                            {showSuggestions && (
                                <div
                                    className="absolute z-20 left-0 right-0 border border-white bg-black bottom-full mb-0.5">
                                    {tagSuggestions.map(tag => (
                                        <div
                                            key={tag}
                                            /*
                                            onMouseDown={() => selectSuggestion(tag)} */
                                            className="dos px-2 url py-0.5 hover:cursor-pointer flex justify-between">
                                            <span className=" w-full">{tag}</span>
                                            {/*
                                            <span className="opacity-50">{tagCounts.get(tag)}</span> */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row mt-1 items-center gap-1">
                        <div>Order by:</div>
                        <button onClick={() => setFilters(prevState => ({ ...prevState, sort: SortBy.Alphabetical }))}
                                className={`border ${filters.sort == SortBy.Alphabetical && ("selected")} w-36 p-1`}>Alphabetically
                        </button>
                        <button onClick={() => setFilters(prevState => ({ ...prevState, sort: SortBy.Date }))}
                                className={`border ${filters.sort == SortBy.Date && ("selected")} w-36 p-1`}>Date
                        </button>
                        <button onClick={() => setFilters(prevState => ({ ...prevState, sort: SortBy.Size }))}
                                className={`border ${filters.sort == SortBy.Size && ("selected")} w-36 p-1`}>Size
                        </button>
                        <button onClick={() => setFilters(prevState => ({ ...prevState, reverse: !prevState.reverse }))}
                                className={`border ml-5 ${filters.reverse && ("selected")} w-36 p-1`}>Reverse
                        </button>
                    </div>
                </div>)}
            </div>
        </>
    );
}