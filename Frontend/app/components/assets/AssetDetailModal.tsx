import React, {Suspense, useEffect, useState} from "react";
import type Asset from "~/models/interfaces/Asset";
import type Artist from "~/models/interfaces/Artist";
import { useAuth } from "~/context/AuthContext";
import { useLoading } from "~/context/LoadingContext";
import {OrbitControls, Stage, useGLTF} from "@react-three/drei";
import {apiCall, downloadFile, GenerateSocial} from "../Functions";
import { Canvas } from "@react-three/fiber";
import ItemEnum from "~/models/enums/ItemEnum";
import {fetchAsset} from "~/api/assets";
import {fetchArtist} from "~/api/artists";

export default function AssetDetailModal({id, setId, setIsNavigating, setSelectedAsset, setTrigger}: {
    id: number,
    setId: (value: number) => void,
    setIsNavigating: (value: boolean) => void
    setSelectedAsset: (asset: Asset) => void,
    setTrigger: (trigger: number) => void,
}) {
    const [asset, setAsset] = useState<Asset | null>();
    const [askConfirmation, setAskConfirmation] = useState(false);
    const {isAuthenticated, isAdmin, id: userId} = useAuth();
    const {isLoading, setIsLoading} = useLoading();
    const [lighting, setLighting] = useState(1.0);
    const [color, setColor] = useState("#000000")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setIsLoading(true);
        fetchAsset(id)
            .then(asset => {
                setAsset(asset);
            })
            .catch(err => console.error(err)).finally(() => setIsLoading(false));
    }, [id]);

    async function deleteAsset(id: number) {
        let response = await apiCall(`/api/Assets/${id}`, new FormData(), "DELETE");
        if (response.ok) {
            setTrigger(Date.now())
            setId(0)
        } else {
            let parsedResponse = await response.json();
            alert(parsedResponse.title);
        }
    }
    
    function copyToClipBoard(value: string) {
        try {
            navigator.clipboard.writeText(value);
        }
        catch (error)
        {
            
        }
        setCopied(true);
    }



    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 pb-8 bg-black/50 z-10 ">

                <div
                    className="flex flex-col mx-auto my-auto w-full h-full 2xl:w-2/3 2xl:h-4/5 bg-black border-2 xl:overflow-hidden overflow-y-auto">
                    <div className="flex shrink-0 w-full gap-2 h-12 border-b-2 flex-row">
                        <div className="dos line-clamp-1 ml-2 text-2xl my-auto">{asset?.name}</div>
                        <div>
                            
                        </div>
                        <div className="flex flex-row ml-auto">
                            <button onClick={() => copyToClipBoard(window.location.href)}
                                    className="dos shrink-0 border hover:cursor-pointer size-8  my-auto m-1"
                                    type="button">
                                <img src={copied ? "https://votvbroadcast.com/images/check.png" : "https://votvbroadcast.com/images/share.png" }/>
                            </button>
                            <button onClick={() => setId(0)}
                                    className="dos shrink-0 border hover:cursor-pointer size-8  my-auto m-1"
                                    type="button">
                                <img src="https://votvbroadcast.com/images/cross.png"/>
                            </button>
                        </div>
                    
                    </div>
                    <div className="flex xl:flex-row flex-col w-full xl:h-full h-250 overflow-visible xl:overflow-hidden">
                        <div className="2xl:w-3/4 xl:max-w-3/4 w-full xl:border-r flex flex-col h-full min-h-0">
                            {asset?.item == ItemEnum["3D Model"] && asset?.previewUrl != "NOT_AVAILABLE" ? (
                                    <div style={{ backgroundColor: color }} className="xl:h-[40vh] bg-[] relative h-[30vh]">
                                        <Canvas camera={{position: [0, 0, 50], fov: 50}}>
                                            <ambientLight intensity={lighting}/>
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
                                        <div className="absolute gap-1 bottom-1 left-1 flex flex-row">
                                            <img className="size-7" src="https://votvbroadcast.com/images/lowLight.png"/>
                                            <input value={lighting} onChange={(e) => setLighting(parseFloat(e.target.value))} step="0.1" min="0.0" max="10.0" className="my-auto slider" type="range"/>
                                            <img className="size-7" src="https://votvbroadcast.com/images/highLight.png"/>
                                            <div className="dos my-auto">{lighting}</div>
                                        </div>
                                        <div className="absolute gap-1 bottom-1 right-1 flex flex-row">
                                            <label className="my-auto hover:cursor-pointer" htmlFor="bgColor"><img className="size-7 my-auto" src="https://votvbroadcast.com/images/paintbrush.png"/></label>
                                            <label htmlFor="bgColor" className="dos hover:cursor-pointer my-auto">BG</label>
                                            <input value={color} onChange={(e) => setColor(e.target.value)} id="bgColor"  className="my-auto hover:cursor-pointer dos border size-8" type="color"/>
                                            <label htmlFor="bg-Color" className="dos hover:cursor-pointer my-auto">{color}</label>
                                        </div>
                                    </div>
                                ) :
                                (<div>
                                        <img className="xl:h-[40vh] h-[30vh]  w-full object-contain m-auto" src={asset?.thumbnailUrl}/>
                                    </div>
                                )}


                            <div className="flex p-1 flex-1 border-b xl:border-b-0 xl:border-r 2xl:border-r-0 flex-col border-t min-h-0">
                                <div className="dos shrink-0">Description:</div>

                                <div className="dos overflow-y-auto flex-1 min-h-0">
                                    {asset?.description ?? "No description available"}
                                </div>
                                <div className="flex max-h-6 line-clamp-1 flex-row">
                                    <div className="dos shrink-0">Source:</div>
                                    <div className="dos overflow-y-auto ">   {asset?.source ?? "No source was provided"}</div>
                                </div>
                               
                                <div className="dos overflow-y-auto items-center gap-1 flex flex-row h-9 mt-auto min-h-0">
                                    <div>Tags:</div>
                                    {asset?.tags != null ? (asset.tags?.map((tag) => {
                                        return <><div className="border p-1 flex"><div className="my-auto">•{tag}</div></div></>
                                    })) : ("Not tagged")}
                                </div>
                            </div>
                        </div>
                        {/*Artist section*/}
                        <div className="xl:w-100 flex flex-col ">
                            <div className="flex flex-row">
                                <img className="size-25" src={asset?.artist?.pfpUrl}/>
                                <div className="dos line-clamp-1 ml-2 text-2xl my-auto">{asset?.artist?.name}</div>
                            </div>
                            <hr/>
                            <div className="flex flex-1 flex-col  min-h-0">
                                <div className="flex flex-col min-h-0 p-1 h-50 xl:flex-1 mb-4">
                                    <div className="dos shrink-0">Artist Description:</div>
                                    <div className="dos overflow-y-auto">
                                        {asset?.artist?.description}
                                    </div>
                                </div>
                                <div className="flex flex-col p-1 min-h-0 h-50 xl:flex-1">
                                    <div className="dos shrink-0">Socials:</div>
                                    <div className="flex-col flex overflow-y-auto">
                                        {asset?.artist?.socials?.map((social) => {
                                            return <GenerateSocial url={social} key={social}/>
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                    <div className="flex border-t shrink-0 mt-auto w-full gap-2 py-2 flex-row">
                        <div className="dos ml-1  hidden items-center flex-row">
                            <div className="dos">Rating:</div>
                            <div className="dos text-2xl"></div>
                        </div>
                        <div className="flex flex-row  mx-auto sm:ml-auto sm:mr-1 gap-1 ">
                            {isAuthenticated ? (
                                (isAdmin || userId == (asset?.ownerId ?? 0)) ? (
                                    <>
                                        {askConfirmation ? (
                                            <button onClick={() => deleteAsset(asset?.id ?? 0)}
                                                    className="dos red shrink-0 border hover:cursor-pointer my-auto">
                                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                    <img className="size-7"
                                                         src="https://votvbroadcast.com/images/trash2.png"/>
                                                    <div className="dos red my-auto">Confirm deletion</div>
                                                </div>
                                            </button>
                                        ) : (
                                            <button onClick={() => setAskConfirmation(true)}
                                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                    <img className="size-7"
                                                         src="https://votvbroadcast.com/images/trash.png"/>
                                                    <div className="dos my-auto">Delete</div>
                                                </div>
                                            </button>
                                        )}
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            fetchAsset(asset?.id ?? 0).then(data => setSelectedAsset(data));
                                            setIsNavigating(false);
                                        }}
                                                className="dos shrink-0 border hover:cursor-pointer my-auto">
                                            <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                <img className="size-7"
                                                     src="https://votvbroadcast.com/images/pencil.png"/>
                                                <div className="dos my-auto">Edit</div>
                                            </div>
                                        </button>
                                    </>
                                ) : ("")
                            ) : ("")}
                            <button onClick={() => downloadFile(asset?.fileUrl ?? "", asset?.filename ?? "")}
                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                    <img className="size-7" src="https://votvbroadcast.com/images/download.png"/>
                                    <div className="dos my-auto">Download</div>
                                </div>


                            </button>

                        </div>

                    </div>
                </div>


            </div>
        </>
    )
}

function Model({url}: { url: string }) {
    const {scene} = useGLTF(url);
    return <primitive object={scene}/>;
}
