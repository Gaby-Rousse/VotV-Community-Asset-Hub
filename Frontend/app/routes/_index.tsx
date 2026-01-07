import {useState} from "react";
import {Link} from "react-router";
import {useAuth} from "~/context/AuthContext";

export default function _index() {
    return (
        <>
            <Nav></Nav>
            <Content></Content>
        </>
    );
}

export function Nav() {

    const [isOpen, setIsOpen] = useState(false);
    const {isAuthenticated} = useAuth()
    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            <nav>
                <div>
                    <div className="flex flex-row h-16 ">
                        <div className="ml-auto flex items-center sm:hidden">

                            <button onClick={toggleMenu} type="button"
                                    className=" mr-4 relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
                                    aria-controls="mobile-menu" aria-expanded="false">

                                {isOpen ? (
                                    <svg className="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                         stroke="currentColor"
                                         aria-hidden="true" data-slot="icon">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                    </svg>) : (
                                    <svg className="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                         stroke="currentColor"
                                         aria-hidden="true" data-slot="icon">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                                    </svg>)}

                            </button>
                        </div>

                        <div className="hidden sm:flex flex-row gap-4 mr-4 ml-auto">
                            <Link className="mt-auto mb-auto p-2 w-28" to="/">Home</Link>
                            <a className="mt-auto mb-auto p-2 w-28" href="https://votvbroadcast.com/">VCB</a>
                            <Link className="mt-auto mb-auto p-2  w-28" to="/assets">Assets</Link>
                            {
                                isAuthenticated ? (
                                    <Link className="mt-auto mb-auto p-2  w-28" to="/account">Account</Link>) : (
                                    <Link className="mt-auto mb-auto p-2  w-28" to="/login">Login</Link>)
                            }


                        </div>
                    </div>
                </div>


                <div className="sm:hidden" id="mobile-menu">
                    <div
                        className={`fixed top-15 right-0 bottom-0 w-1/2 bg-black/50 z-10 flex flex-col gap-2 transition-transform duration-300 ${
                            isOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        <Link className="mx-auto p-2 w-36" to="/">Home</Link>
                        <a className="mx-auto p-2 w-36" href="https://votvbroadcast.com/">VCB</a>
                        <Link className="mx-auto p-2 w-36" to="/assets">Assets</Link>
                        {
                            isAuthenticated ? (
                                <Link className="mt-auto mb-auto p-2  w-28" to="/account">Account</Link>) : (
                                <Link className="mt-auto mb-auto p-2  w-28" to="/login">Login</Link>)
                        }
                    </div>
                </div>
            </nav>
        </>
    )
}

export function Content() {
    return (
        <>
            <h1 className=" text-center title text-2xl sm:text-4xl md:text-5xl lg:text-6xl">VotV
                Community Asset
                Hub</h1>
            <div className="sm:mt-20 mt-10 mb-10 ml-0 sm:ml-20 mr-auto">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">Links
                </div>
                <div className="flex flex-col gap-4 mt-2 mb-6 items-center sm:items-baseline">
                    <a className="p-2 w-40 home" href="https://votv.dev">votv.dev</a>
                    <Link className="p-2 w-40 home" to="/changelog">Changelog</Link>
                    <Link className="p-2 w-40 home" to="/credits">Credits</Link>
                </div>

                <div
                    className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">Description
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline">
                    <div className="w-[70%]">VotV Community Asset Hub is a fan made website and is not affiliated with
                        MrDrNose.
                    </div>
                    <div className="w-[70%]">Its purpose is to provide assets from the community in a more permanent way
                        than Discord forums
                    </div>
                    {/*
                    <div className="w-[70%]">Here whats currently offered:
                    </div>
                    
                    <div className="flex flex-row gap-4 mt-4">
                        <a className="p-2 w-40 home">3D Models</a>
                        <a className="p-2 w-40 home">ATV Skins</a>
                        <a className="p-2 w-40 home">Flags</a>
                        <a className="p-2 w-40 home">Pictures</a>
                    </div>
                    <div className="flex flex-row gap-4 mt-4">
                        <a className="p-2 w-40 home">Posters</a>
                        <a className="p-2 w-40 home">Rugs</a>
                        <a className="p-2 w-40 home">Stickers</a>
                    </div>
                    */}
                </div>
            </div>
        </>
    )
}

