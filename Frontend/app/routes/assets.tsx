import React, {useState} from "react";
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
export default function Assets() {
    const [page, setPage] = useState<Page>(Page.Asset);
    const [isNavigating, setIsNavigating] = useState(true);
    const {isAuthenticated} = useAuth();
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
                ? <ArtistForm key={selectedArtist?.id ?? "new-artist"} setIsNavigating={setIsNavigating} setSelectedArtist={setSelectedArtist} artist={selectedArtist}/>
                : <AssetForm key={selectedAsset?.id ?? "new-asset"} item={filters.item} asset={selectedAsset} setIsNavigating={setIsNavigating}/>;
        if (page === Page.Artists)
            return <ListArtists setSelectedArtist={setSelectedArtist} setIsNavigating={setIsNavigating}/>;
        return <ListAssets setIsNavigating={setIsNavigating} setSelectedAsset={setSelectedAsset}/>;
    };

    return (
        <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
            <Nav
                isAuthenticated={isAuthenticated}
                isNavigating={isNavigating}
                toggleNavigating={toggleNavigating}
                page={page}
                setPage={setPage}
            />
            {renderContent()}
        </div>
    );
}