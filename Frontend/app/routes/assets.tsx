import React, {Suspense, useEffect, useState} from "react";
import {useAuth} from '~/context/AuthContext';
import type Artist from "~/models/interfaces/Artist";
import type Asset from "~/models/interfaces/Asset";
import {useFilters} from "~/context/FiltersContext";
import AssetForm from "~/components/assets/AssetForm";
import {Nav} from "~/components/assets/AssetsNav";
import VCBAdvertisement from "~/components/other/VCBAdvertisement";
import ListAssets from "~/components/assets/AssetsList";
import ListArtists from "~/components/artists/ArtistsList";
import ArtistForm from "~/components/artists/ArtistForm";
import {Page} from "~/models/enums/Page";
import {filtersToParams} from "~/helpers/filterParams";
import {apiCall} from "~/components/Functions";
import {useLoading} from "~/context/LoadingContext";
import TypeEnum from "~/models/enums/TypeEnum";
import {fetchArtist} from "~/api/artists";
import ItemEnum from "~/models/enums/ItemEnum";
import {Canvas} from "@react-three/fiber";
import {OrbitControls, Stage} from "@react-three/drei";
import {Model} from "~/components/assets/AssetDetailModal";

export default function Assets() {
    const [page, setPage] = useState<Page>(Page.Asset);
    const [isNavigating, setIsNavigating] = useState(true);
    const {filters} = useFilters();
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const toggleNavigating = () => {
        setSelectedArtist(null);
        setSelectedAsset(null);
        setIsNavigating(!isNavigating);
    };

    const renderContent = () => {
        if (page === Page.Radio || page === Page.TV)
            return <VCBAdvertisement isNavigating={isNavigating}/>;
        if (!isNavigating)
            return page === Page.Artists
                ? <ArtistForm key={selectedArtist?.id ?? "new-artist"} setIsNavigating={setIsNavigating}
                              setSelectedArtist={setSelectedArtist} artist={selectedArtist}/>
                : <AssetForm key={selectedAsset?.id ?? "new-asset"} item={filters.item} asset={selectedAsset}
                             setIsNavigating={setIsNavigating}/>;
        if (page === Page.Artists)
            return <ListArtists setSelectedArtist={setSelectedArtist} setIsNavigating={setIsNavigating}
                                setPage={setPage}/>;
        if (page === Page.Admin)
            return <AdminCorner/>
        return <ListAssets setIsNavigating={setIsNavigating} setSelectedAsset={setSelectedAsset}/>;
    };

    return (
        <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
            <Nav
                isNavigating={isNavigating}
                toggleNavigating={toggleNavigating}
                page={page}
                setPage={setPage}
            />
            {renderContent()}
        </div>
    );
}

const AdminCorner = () => {
    const [edits, setEdits] = useState<any[]>([]);
    const {setIsLoading} = useLoading();
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        apiCall("/api/edits", null)
            .then(res => res.json())
            .then(response => {
                setEdits(response);
            })
            .catch(err => console.error('Failed to fetch edits:', err))
            .finally(() => setIsLoading(false));
    }, [trigger]);

    return (
        <>
            <div className="dos">Admin corner</div>
            <div className="overflow-y-auto flex flex-col gap-2">
                {edits?.map((edit, index) => (
                    edit.table == 0 ? (<AssetEdit asset={edit.target as Asset} changes={edit.changes} id={edit.id} setTrigger={setTrigger}/>) : (<ArtistEdit artist={edit.target as Artist} changes={edit.changes} id={edit.id} setTrigger={setTrigger}/>)
                ))}
            </div>
        
        </>
    );
};

const AssetEdit = ({asset, changes, id, setTrigger}: { asset: Asset, changes: any, id:number, setTrigger: (value:number) => void }) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const ratios: Record<TypeEnum, string> = {
        [TypeEnum.Square]: "1/1",
        [TypeEnum.Table]: "3/4",
        [TypeEnum.Vertical]: "5/8",
        [TypeEnum.Horizontal]: "5/4",
        [TypeEnum.All]: "1/1"
    }
    
    const {setIsLoading} = useLoading();

    return (
        <div className="border flex flex-col gap-3 m-auto w-[90%] p-4">
            <div className="flex dos flex-row items-center gap-3">
                AssetId: {asset.id}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Thumbnail:</div>
                <img className={`w-12 p-0.5 border aspect-${ratios[asset.type!]} object-contain`}
                     src={asset.thumbnailUrl}/>

                {changes.thumbnail && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <img className={`w-12 p-0.5 border aspect-${ratios[asset.type!]} object-contain`}
                             src={origin + "/temp_uploads/thumbnails/" + changes.thumbnail}
                        />
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Name:</div>
                <div>{asset.name}</div>
                {changes.name && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div>{changes.name}</div>
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Description:</div>
                <div>{asset.description}</div>
                {changes.description && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div>{changes.description}</div>
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Artist:</div>
                <img className="size-10 border" src={asset.artist.pfpUrl}/>
                <div>{asset.artist.name}</div>
                {changes.artistId && (
                    <ArtistDisplay artistId={parseInt(changes.artistId)}/>

                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Source:</div>
                <div>{asset.source}</div>
                {changes.source && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div>{changes.source}</div>
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Tags:</div>
                <div className="flex flex-row gap-1">
                    {asset.tags && asset.tags.length > 0
                        ? asset.tags.map(t => <div key={t.name} className="border p-1">•{t.name}</div>)
                        : "None"}
                </div>
                {changes.tags && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div className="flex flex-row gap-1">
                            {changes.tags.length > 0
                                ? changes.tags.map((t: string) => <div key={t} className="border p-1">•{t}</div>)
                                : "None"}
                        </div>
                    </>
                )}
            </div>
            {asset?.item == ItemEnum["3D Model"] && (<div className="dos">Preview:</div>)}

            <div className="flex dos flex-row items-center gap-3">
                {asset?.item == ItemEnum["3D Model"] && asset?.previewUrl != "NOT_AVAILABLE" && (
                    <div className="relative h-48 w-40">
                        <Canvas camera={{position: [0, 0, 50], fov: 50}}>
                            <ambientLight/>
                            <directionalLight position={[5, 5, 5]}/>
                            <Suspense fallback={null}>
                                <Stage intensity={0}
                                       environment={null}
                                       shadows={false}
                                       adjustCamera={true}>
                                    <Model url={asset?.previewUrl ?? ""}/>
                                </Stage>
                            </Suspense>
                            <OrbitControls autoRotate/>
                        </Canvas>
                    </div>
                    
                )}
                {changes.preview && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div className="relative h-48 w-40">
                            <Canvas camera={{position: [0, 0, 50], fov: 50}}>
                                <ambientLight/>
                                <directionalLight position={[5, 5, 5]}/>
                                <Suspense fallback={null}>
                                    <Stage intensity={0}
                                           environment={null}
                                           shadows={false}
                                           adjustCamera={true}>
                                        <Model url={origin + "/temp_uploads/previews/" + changes.preview}/>
                                    </Stage>
                                </Suspense>
                                <OrbitControls autoRotate/>
                            </Canvas>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-row ml-auto gap-1">
                <button onClick={() => ApproveEdit(id, setIsLoading, setTrigger)} className="computerButton flex items-center gap-1 flex-row border py-1 px-4"><img className="size-5" src="https://votvbroadcast.com/images/check.png" alt="v"/> Approve</button>
                <button onClick={() => RejectEdit(id, setIsLoading, setTrigger)} className="computerButton flex items-center gap-1  flex-row border py-1 px-4"><img className="size-5" src="https://votvbroadcast.com/images/cross.png" alt="v"/>  Reject</button>
            </div>
            
        </div>

    )
}

const ArtistEdit = ({artist, changes, id, setTrigger}: { artist: Artist, changes: any, id:number, setTrigger: (value:number) => void }) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const {setIsLoading} = useLoading();
    
    return (
        <div className="border flex flex-col gap-3 m-auto w-[90%] p-4">
            <div className="flex dos flex-row items-center gap-3">
                ArtistId: {artist.id}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Avatar:</div>
                <img className={`size-12 p-0.5 border object-contain`}
                     src={artist.pfpUrl}/>

                {changes.pfp && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <img className={`size-12 p-0.5 border object-contain`}
                             src={origin + "/temp_uploads/avatars/" + changes.pfp}
                        />
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Name:</div>
                <div>{artist.name}</div>
                {changes.name && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div>{changes.name}</div>
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Description:</div>
                <div>{artist.description}</div>
                {changes.description && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div>{changes.description}</div>
                    </>
                )}
            </div>
            <div className="flex dos flex-row items-center gap-3">
                <div>Socials:</div>
                <div className="flex flex-col gap-1">
                    {artist.socials && artist.socials.length > 0
                        ? artist.socials.map((s, i) => <a target="_blank" href={s} key={i} className="border url py-1 px-3">{s}</a>)
                        : "None"}
                </div>
                {changes.socials && (
                    <>
                        <div className="text-xl font-bold">====&gt;</div>
                        <div className="flex flex-col gap-1">
                            {changes.socials.length > 0
                                ? changes.socials.map((s: string, i: number) => <a target="_blank" href={s} key={i} className="border url py-1 px-3">{s}</a>)
                                : "None"}
                        </div>
                    </>
                )}
            </div>


            <div className="flex flex-row ml-auto gap-1">
                <button onClick={() => ApproveEdit(id, setIsLoading, setTrigger)} className="computerButton flex items-center gap-1 flex-row border py-1 px-4"><img className="size-5" src="https://votvbroadcast.com/images/check.png" alt="v"/> Approve</button>
                <button onClick={() => RejectEdit(id, setIsLoading, setTrigger)} className="computerButton flex items-center gap-1  flex-row border py-1 px-4"><img className="size-5" src="https://votvbroadcast.com/images/cross.png" alt="v"/>  Reject</button>
            </div>

        </div>

    )
}



const ArtistDisplay = ({artistId}: { artistId: number }) => {
    const [artist, setArtist] = useState<Artist>();

    useEffect(() => {
        apiCall(`/api/artists/${artistId}`,null)
            .then(res => res.json())
            .then(data => setArtist(data))
            .catch(() => console.log("error while fetching artist"));
    }, [artistId]);

    return (
        <>
            <div className="text-xl font-bold">====&gt;</div>
            <img className="size-10 border" src={artist?.pfpUrl}/>
            <div className="font-medium">{artist?.name}</div>
        </>
    );
};

async function ApproveEdit(id:number, setIsLoading: (value:boolean) => void, setTrigger: (value: number) => void)
{
    setIsLoading(true)
    await apiCall(`/api/edits/${id}/approve`,new FormData,"POST").then(() => setIsLoading(false)).then(() => setTrigger(Date.now()))
}

async function RejectEdit(id:number, setIsLoading: (value:boolean) => void, setTrigger: (value: number) => void)
{
    setIsLoading(true)
    await apiCall(`/api/edits/${id}/reject`,new FormData,"POST").then(() => setIsLoading(false)).then(() => setTrigger(Date.now()))
}