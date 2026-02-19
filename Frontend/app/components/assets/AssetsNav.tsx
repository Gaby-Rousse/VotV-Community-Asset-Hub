import {Link} from "react-router";
import TypeEnum from "~/models/enums/TypeEnum";

export function Nav({selectedButton, setSelectedButton, toggleNavigating, isNavigating, isAuthenticated, pictureType, setPictureType}: {
    selectedButton: string,
    setSelectedButton: (selectedButton: string) => void
    toggleNavigating: () => void
    isNavigating: boolean
    isAuthenticated: boolean
    pictureType: number | null;
    setPictureType: (value: number | null) => void
}) {
    return (
        <>
            <div className=" flex flex-col border-solid border-3 md:m-0.5">
                <div className="px-1 overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-x-auto flex flex-row gap-1 flex-nowrap w-full">
                    <Link
                        className="computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 shrink-0 flex"
                        to="/"><img className="size-6" alt="home"
                                    src="https://votvbroadcast.com/images/home.png"/></Link>
                    <ComputerButton text="3D Models" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="ATV Skins" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Flags" selectedButton={selectedButton} setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Pictures" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>


                    <ComputerButton text="Posters" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Rugs" selectedButton={selectedButton} setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Stickers" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Radio" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="TV" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>

                    <div className="flex flex-row ml-auto shrink-0">
                        {isAuthenticated ? (<button
                            onClick={() => toggleNavigating()}
                            className={`computerButton shrink-0 border-2 w-28 border-solid p-0.5 mt-1 mb-1 mr-1 pl-4 pr-4 hover:cursor-pointer ${isNavigating ? '' : 'selected'} `}>
                            Upload
                        </button>) : ('')}
                        <ComputerButton text="Artists" selectedButton={selectedButton}
                                        setSelectedButton={setSelectedButton}/>
                    </div>
                </div>
                {selectedButton == "Pictures" ? ( <div className="px-1 pb-1 overflow-visible overflow-x-auto flex flex-row gap-1 flex-nowrap w-full">
                    <button onClick={() => setPictureType(TypeEnum.Horizontal)} className={`hover:cursor-pointer flex-1 dos border-2 ${pictureType == TypeEnum.Horizontal && 'selected'}`}>Horizontal</button>
                    <button onClick={() => setPictureType(TypeEnum.Square)} className={`hover:cursor-pointer flex-1 dos border-2 ${pictureType == TypeEnum.Square && 'selected'}`}>Square</button>
                    <button onClick={() => setPictureType(TypeEnum.Vertical)} className={`hover:cursor-pointer flex-1 dos border-2 ${pictureType == TypeEnum.Vertical && 'selected'}`}>Vertical</button>
                    <button onClick={() => setPictureType(TypeEnum.Table)} className={`hover:cursor-pointer flex-1 dos border-2 ${pictureType == TypeEnum.Table && 'selected'}`}>Table</button>
                </div>) : ("")}

            </div>
        </>
    )
}

export function ComputerButton({text, selectedButton, setSelectedButton}: {
    text: string,
    selectedButton: string,
    setSelectedButton: (value: string) => void
}) {
    return (
        <button
            onClick={() => setSelectedButton(text)}
            className={`w-28 shrink-0 computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 pl-4 pr-4 ${selectedButton === text ? 'selected' : ''}`}>
            {text}
        </button>
    )
}
