import {Link} from "react-router";
import TypeEnum from "~/models/enums/TypeEnum";
import ItemEnum from "~/models/enums/ItemEnum";
import {useFilters} from "~/context/FiltersContext";
import {Page} from "~/models/enums/Page";
import {useAuth} from "~/context/AuthContext";

const NAV_ITEMS: { label: string; item: ItemEnum }[] = [
    {label: "3D Models", item: ItemEnum["3D Model"]},
    {label: "ATV Skins", item: ItemEnum["ATV Skin"]},
    {label: "Flags",     item: ItemEnum.Flag},
    {label: "Pictures",  item: ItemEnum.Picture},
    {label: "Posters",   item: ItemEnum.Poster},
    {label: "Rugs",      item: ItemEnum.Rug},
    {label: "Stickers",  item: ItemEnum.Sticker},
];

const PICTURE_TYPES = [
    {label: "Horizontal", type: TypeEnum.Horizontal},
    {label: "Square",     type: TypeEnum.Square},
    {label: "Vertical",   type: TypeEnum.Vertical},
    {label: "Table",      type: TypeEnum.Table},
];

export function Nav({toggleNavigating, isNavigating, page, setPage}: {
    toggleNavigating: () => void
    isNavigating: boolean
    page: Page
    setPage: (view: Page) => void
}) {
    const {filters, setFilters} = useFilters();
    const {isAuthenticated, isAdmin} = useAuth();

    return (
        <div className="flex flex-col border-solid border-3 md:m-0.5">
            <div className="px-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-row gap-1 flex-nowrap w-full">
                <Link className="computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 shrink-0 flex" to="/">
                    <img className="size-6" alt="home" src="https://votvbroadcast.com/images/home.png"/>
                </Link>

                {NAV_ITEMS.map(({label, item}) => (
                    <ComputerButton
                        key={label}
                        text={label}
                        selected={filters.item === item && page === Page.Asset}
                        onClick={() => { setPage(Page.Asset); setFilters(prev => ({...prev, item, type: TypeEnum.All})); }}
                    />
                ))}

                <ComputerButton text="Radio" selected={page === Page.Radio} onClick={() => setPage(Page.Radio)}/>
                <ComputerButton text="TV" selected={page === Page.TV} onClick={() => setPage(Page.TV)}/>
                <div className="flex flex-row ml-auto shrink-0">
                    {isAuthenticated && isAdmin && (
                    <div className="mr-1">
                        <ComputerButton text="Admin" selected={page === Page.Admin} onClick={() => setPage(Page.Admin)}/>
                    </div>)}
                    {isAuthenticated && (
                        <button
                            onClick={toggleNavigating}
                            className={`computerButton shrink-0 border-2 w-28 border-solid p-0.5 mt-1 mb-1 mr-1 pl-4 pr-4 hover:cursor-pointer ${isNavigating ? '' : 'selected'}`}>
                            Upload
                        </button>
                    )}
                    <ComputerButton text="Artists" selected={page === Page.Artists} onClick={() => setPage(Page.Artists)}/>
                </div>
            </div>

            {filters.item === ItemEnum.Picture && page === Page.Asset && (
                <div className="px-1 pb-1 overflow-x-auto flex flex-row gap-1 flex-nowrap w-full">
                    {PICTURE_TYPES.map(({label, type}) => (
                        <button
                            key={label}
                            onClick={() => setFilters(prev => ({...prev, type}))}
                            className={`hover:cursor-pointer flex-1 dos border-2 ${filters.type === type ? 'selected' : ''}`}>
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ComputerButton({text, selected, onClick}: {
    text: string
    selected: boolean
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-28 shrink-0 computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 pl-4 pr-4 ${selected ? 'selected' : ''}`}>
            {text}
        </button>
    );
}