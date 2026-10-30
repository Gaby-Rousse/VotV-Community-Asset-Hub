import {useEffect, useRef, useState} from "react";
import {useAuth} from "~/context/AuthContext";
import type Asset from "~/models/interfaces/Asset";
import {useLoading} from "~/context/LoadingContext";
import {apiCall, humanDate, selectAspectRatio} from "~/components/Functions";
import AssetDetailModal from "~/components/assets/AssetDetailModal";
import {useSearchParams} from "react-router";
import {defaultFilters, SearchBy, SortBy} from "~/models/interfaces/Filters";
import {defaultInfo, type Info} from "~/models/interfaces/Info";
import {useFilters} from "~/context/FiltersContext";
import {filtersToParams} from "~/helpers/filterParams";
import SimpleBar from "simplebar-react";
import ItemEnum from "~/models/enums/ItemEnum";
import RatingCheckboxInput from "~/components/other/RatingCheckboxInput";
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";

type TagSuggestion = { name: string, count: number };

export default function ListAssets({setIsNavigating, setSelectedAsset}: {
    setIsNavigating: (item: boolean) => void,
    setSelectedAsset: (value: Asset) => void,
}) {
    const { filters, setFilters } = useFilters();
    const [searchParams, setSearchParams] = useSearchParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [info, setInfo] = useState<Info>(defaultInfo);
    const [assetId, setAssetId] = useState(parseInt(searchParams.get("assetId") ?? "0"));
    const [trigger, setTrigger] = useState(0);
    const {isLoading, setIsLoading} = useLoading();
    const {isAuthenticated, id, isAdmin, explicitConsent} = useAuth()
    const [menuOpened, setMenuOpened] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0.0);
    //0 thumbnail, 1 list, 2 posts
    const [display, setDisplay] = useState(0);
    const [tagQuery, setTagQuery] = useState(filters.tags.join(" "))
    const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fromInput = tagQuery.trim().split(/\s+/).filter(Boolean);
        const fromFilters = filters.tags;
        if (fromInput.join(" ") !== fromFilters.join(" ")) {
            setTagQuery(filters.tags.join(" "));
        }
    }, [filters.tags]);
    
    useEffect(() => {
        const params = filtersToParams(filters);
        const assetId = searchParams.get("assetId");
        if (assetId) params.set("assetId", assetId);
        setSearchParams(params, { replace: true });
    }, [filters]);

    useEffect(() => {
        const delay = filters.search !== "" || filters.tags.length > 0 ? 300 : 0;

        const timeout = setTimeout(() => {
            let start = performance.now();
            setIsLoading(true);
            const url = `/api/Assets?${filtersToParams(filters).toString()}`;
            apiCall(url, null).then(res => res.json())
                .then(response => {
                    setAssets(response.data);
                    setInfo({totalCount: response.totalCount, totalPages: response.totalPages, ratingsCount: response.ratingsCount});
                    setTimeTaken(performance.now() - start);
                })
                .catch(err => console.error('Failed to fetch assets:', err))
                .finally(() => setIsLoading(false));
        }, delay);

        return () => clearTimeout(timeout);
    }, [trigger, filters, explicitConsent]);

    function updateAssetId(assetId: number) {
        const params = filtersToParams(filters);
        if (assetId === 0) {
            params.delete("assetId");
        } else {
            params.set("assetId", assetId.toString());
        }
        setSearchParams(params, { replace: true });
        setAssetId(assetId);
    }

    useEffect(() => {
        setFilters(prevState => ({...prevState, page: 1}))
    }, [filters.item]);

    async function fetchTagSuggestions(prefix: string) {
        if (prefix.length === 0) {
            setTagSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const res = await apiCall(`/api/Tags?prefix=${encodeURIComponent(prefix)}&item=${filters.item}`, null, "GET");
        const data = await res.json();
        setTagSuggestions(data);
        setShowSuggestions(data.length > 0);
    }

    function handleTagInput(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setTagQuery(value);
        const lastWord = value.split(" ").pop() ?? "";
        fetchTagSuggestions(lastWord);
        setFilters(prev => ({
            ...prev,
            tags: value.trim().split(/\s+/).filter(t => t.length > 0),
            page: 1
        }));
    }

    function selectSuggestion(tag: TagSuggestion) {
        const parts = tagQuery.split(" ");
        parts[parts.length - 1] = tag.name + " ";
        const newQuery = parts.join(" ");
        setTagQuery(newQuery);
        setTagSuggestions([]);
        setShowSuggestions(false);
        setFilters(prev => ({
            ...prev,
            tags: newQuery.trim().split(/\s+/).filter(t => t.length > 0),
            page: 1
        }));
        inputRef.current?.focus();
    }

    return (
        <>
            {assetId != 0 ? (<AssetDetailModal id={assetId} setId={updateAssetId} setSelectedAsset={setSelectedAsset}
                                               setIsNavigating={setIsNavigating} setTrigger={setTrigger}/>) : ("")}

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
                <button onClick={() => setFilters(defaultFilters)}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-1 shrink-0`}>
                    <img className="size-5" src="noFilters.png" alt="noFilters"/>
                </button>
                <input type="text"
                       value={filters.search ?? ""}
                       onChange={(e) => setFilters(prevState => ({...prevState, search: e.target.value}))}
                       className="dos text-center mr-1 mb-0.5 sm:m-0 border w-full"
                       placeholder="Search..."/>
                <button onClick={() => setFilters(prevState => ({...prevState, searchBy: SearchBy.Name}))}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-2 ${filters.searchBy == SearchBy.Name ? ("selected") : ("")}`}>By
                    Title
                </button>
                <button onClick={() => setFilters(prevState => ({...prevState, searchBy: SearchBy.Artist}))}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-2 ${filters.searchBy == SearchBy.Artist ? ("selected") : ("")}`}>By
                    Artist
                </button>
                <button
                    onClick={() => setFilters(prevState => ({...prevState, ownerId: prevState.ownerId === id ? "" : id}))}
                    className={`dos border mr-1 md:whitespace-nowrap hover:cursor-pointer px-2 ${filters.ownerId === id ? "selected" : ""}`}>
                    Owned
                </button>
            </div>
            <SimpleBar className="flex-1 min-h-0">
                <div className="flex justify-center items-center mt-3 mb-8.5 sm:mt-1 px-1 gap-3 flex-wrap flex-row ">
                {
                    display == 0 ? (assets.map((a) => (
                        <div onClick={() => updateAssetId(a.id)} className="flex hover:cursor-pointer flex-col"
                             key={a.id}>
                            <div className={`mx-auto ${selectAspectRatio({
                                type: filters.type
                            })} border relative ${a.item == ItemEnum.Poster && "poster-bg"} `}>
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
                                    <div className={`${a.item == ItemEnum.Poster && "poster-bg"} size-8`}>
                                        <img loading="lazy" className="size-8 shrink-0 object-contain" src={a.thumbnailUrl}/>
                                    </div>

                                    <div className="flex-1 min-w-0 truncate">{a.name}</div>
                                    <div className="w-30 md:w-40 lg:w-60 shrink-0 truncate">{a.artistName}</div>
                                    <div className="hidden md:flex w-25 shrink-0">{humanDate(a.createdAt ?? "")}</div>
                                </div>
                            ))}
                        </>
                    )
                }
                </div>
            </SimpleBar>

            <div
                className={`dos border absolute z-10 transition-all bg-black left-0 ${menuOpened ? ("h-70") : ("h-8")} bottom-0 flex flex-col w-full`}>
                <div onClick={() => setMenuOpened(!menuOpened)}
                     className="flex flex-row h-8 w-full px-6 hover:cursor-pointer border-b items-center">
                    <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
                    <div className="mx-auto dos">Advanced Search</div>
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
                        <div className="my-auto">Rating(s):</div>
                        <RatingCheckboxInput oldValue={filters.ratings} setReaderValue={r => setFilters(prev => ({...prev, ratings: r, page: 1}))} ratingsCount={info.ratingsCount}/>
                    </div>
                    <div className="flex gap-1 mt-1 flex-row">
                        <div className="text-nowrap">Tags filter:</div>
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={tagQuery}
                                onChange={handleTagInput}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                className="dos text-center border w-full"
                                placeholder="Tags (separated by spaces)"/>
                            {showSuggestions && (
                                <div
                                    className="absolute z-20 left-0 right-0 border border-white bg-black bottom-full mb-0.5">
                                    {tagSuggestions.map(tag => (
                                        <div
                                            key={tag.name}
                                            onMouseDown={() => selectSuggestion(tag)}
                                            className="dos px-2 url py-0.5 hover:cursor-pointer flex justify-between">
                                            <span className="w-full">{tag.name}</span>
                                            <span className="opacity-50">({tag.count})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row mt-1 items-center gap-1">
                        <div>Order by:</div>
                        <button onClick={() => setFilters(prevState => ({...prevState, sort: SortBy.Alphabetical}))}
                                className={`border ${filters.sort == SortBy.Alphabetical && ("selected")} w-36 p-1`}>Alphabetically
                        </button>
                        <button onClick={() => setFilters(prevState => ({...prevState, sort: SortBy.Date}))}
                                className={`border ${filters.sort == SortBy.Date && ("selected")} w-36 p-1`}>Date
                        </button>
                        <button onClick={() => setFilters(prevState => ({...prevState, sort: SortBy.Size}))}
                                className={`border ${filters.sort == SortBy.Size && ("selected")} w-36 p-1`}>Size
                        </button>
                        <button
                            onClick={() => setFilters(prevState => ({...prevState, reverse: !prevState.reverse}))}
                            className={`border ml-5 ${filters.reverse && ("selected")} w-36 p-1`}>Reverse
                        </button>
                    </div>
                </div>)}
            </div>
        </>
    );
}