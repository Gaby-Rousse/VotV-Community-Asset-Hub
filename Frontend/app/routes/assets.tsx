import React, {useEffect, useState} from "react";
import {useAuth} from '~/context/AuthContext';
import type Artist from "~/models/interfaces/Artist";
import type Asset from "~/models/interfaces/Asset";
import ItemEnum from "~/models/enums/ItemEnum";
import {useLoading} from "~/context/LoadingContext";
import AssetForm from "~/components/assets/AssetForm";
import {Nav} from "~/components/assets/AssetsNav";
import VCBAdvertisement from "~/components/other/VCBAdvertisement";
import ListAssets from "~/components/assets/AssetsList";
import ListArtists from "~/components/artists/ArtistsList";
import ArtistForm from "~/components/artists/ArtistForm";

const labelDictionary: Record<string,number> = {
    "3D Models": ItemEnum["3D Model"],
    "ATV Skins": ItemEnum["ATV Skin"],
    "Flags": ItemEnum["Flag"],
    "Pictures": ItemEnum["Picture"],
    "Posters": ItemEnum["Poster"],
    "Rugs": ItemEnum["Rug"],
    "Stickers": ItemEnum["Sticker"],
}

export default function Assets() {
    const [selectedButton, setSelectedButton] = useState("3D Models");
    const [isNavigating, setIsNavigating] = useState(true);
    const {isAuthenticated, id, isAdmin} = useAuth();
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [pictureType, setPictureType] = useState<number | null>(null)
    const toggleNavigating = () => {
        setSelectedArtist(null);
        setSelectedAsset(null);
        setIsNavigating(!isNavigating);
    };
    const {isLoading, setIsLoading} = useLoading();

    useEffect(() => {
        setPictureType(null)
    }, [selectedButton]);

    return (
        <>
            <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
                <Nav isAuthenticated={isAuthenticated} isNavigating={isNavigating} toggleNavigating={toggleNavigating}
                     selectedButton={selectedButton}
                     setSelectedButton={setSelectedButton}
                     pictureType={pictureType}
                     setPictureType={setPictureType}
                ></Nav>
                {
                    selectedButton === "Radio" || selectedButton === "TV" ? (
                        <VCBAdvertisement isNavigating={isNavigating}/>) : isNavigating ? (
                        selectedButton === "Artists" ? (
                            <ListArtists setSelectedArtist={setSelectedArtist} setIsNavigating={setIsNavigating}/>
                        ) : (
                            <ListAssets
                                item={labelDictionary[selectedButton]}
                                setIsNavigating={setIsNavigating}
                                setSelectedAsset={setSelectedAsset}
                                pictureType={pictureType}
                            />
                        )
                    ) : selectedButton === "Artists" ? (
                        <ArtistForm
                            key={selectedArtist?.id ?? "new-artist"}
                            setIsNavigating={setIsNavigating}
                            setSelectedArtist={setSelectedArtist}
                            artist={selectedArtist}
                        />
                    ) : (
                        <AssetForm
                            key={selectedAsset?.id ?? "new-asset"}
                            item={labelDictionary[selectedButton]}
                            asset={selectedAsset}
                            setIsNavigating={setIsNavigating}
                        />
                    )
                }
            </div>
        </>
    )
}













