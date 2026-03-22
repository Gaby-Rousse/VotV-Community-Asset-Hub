import {Nav} from "~/routes/_index";

export default function Changelog()
{
    return (
        <>
            <Nav/>
            <h1 className="text-center title text-2xl sm:text-4xl md:text-5xl lg:text-6xl">Changelog</h1>
            <div className="sm:mt-20 mt-10 mb-10 ml-auto sm:ml-20 mr-auto w-[70%]">
                <div
                    className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">Planned
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                        <li>(Do not mind the order of this list)</li>
                        <li>Add suggestions page</li>
                        <li>Add bug report page</li>
                        <li>Add reports</li>
                        <li>Add rudimentary mailbox</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.2.0
                    (03/20/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                        <li>Added proposal system</li>
                        <li className="ml-5">You can propose edits to files you don't own</li>
                        <li className="ml-5">Admin rejects or approve your proposals</li>
                        <li className="ml-5">You can remove your proposals in the advanced fields of a media</li>
                        <li>You can transfer the ownership of an asset to someone</li>
                        <li>Filters are now only server side. You also won't load all assets all at once</li>
                        <li className="ml-5">Added pagination, 40 assets/artists per page</li>
                        <li className="ml-5">Added sort by filesize</li>
                        <li className="ml-5">You can share a page with your filters (so users see the same result as you)</li>
                        <li className="ml-5">Tags are now centralized. If the tags you're adding exists on another assets, it will be suggested</li>
                        <li>Thumbnails are now compressed and are extremely faster to load.</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1.0.5
                    (03/03/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                       <li>Removed rating</li>
                       <li>Added size information</li>
                       <li>Users can now share assets</li>
                       <li>Improved tags filter</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1.0.4
                    (01/24/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                       <li>Server doesn't auto-convert 3D models into .glb anymore
                           If you want a 3D preview you must provide a .glb yourself</li>
                        <li>Added new menu that contains:</li>
                        <li className="ml-5">Some stats</li>
                        <li className="ml-5">Display settings (list or thumbnails)</li>
                        <li className="ml-5">Rudimentary tags filter</li>
                        <li className="ml-5">Order by (Alphabetically or Date + Reversed or not)</li>
                        <li>Added tags input to Asset Form</li>
                        <li>Made the source visible on the Asset viewer and tags too.</li>
                        <li>More icons are supported for socials</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1.0.3
                    (01/21/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                        <li>Improved Mobile UI</li>
                        <li>Fixed artist page overflow</li>
                        <li>Added various display for the different aspect ratio</li>
                        <li>Thumbnails are now cropped automatically on the server</li>
                        <li>You can now filter the pictures by their ratio (Horizontal, Square, Vertical, Table)</li>
                        <li>Added animation for buttons similar to the VotV behavior when clicking on one</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1.0.2
                    (01/20/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                        <li>Added the possibility for users to add their own .glb files for previews</li>
                        <li>Fixed a bug that was showing the description for the "source" input too when editing an asset</li>
                        <li>Improved UI on mobile</li>
                        <li>Improved the preview for 3D models</li>
                        <li className="ml-5">Items are auto-scaled to fit and auto-centered</li>
                        <li className="ml-5">Users can change the intensity of the light in the scene</li>
                        <li className="ml-5">Users can change the background color of the scene</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1.0.1
                    (01/19/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                    <ul>
                       <li>Resolved a bug that made users unable to see fresh data due to a bad cache policy applied to the API</li>
                       <li>Added search bar for the artists tab</li>
                        <li>Added a filter to only see the assets/artists you uploaded</li>
                        <li>Fixed error 404 on page changelog and credits</li>
                    </ul>
                </div>
                <div className=" text-xl sm:text-2xl md:text-3xl lg:text-4xl subtitle sm:text-left text-center">v0.1 Public Release
                    (01/18/2026)
                </div>
                <div className="flex flex-col gap-2 mt-2 mb-6 items-center sm:items-baseline ">
                </div>
            </div>
            </>
            )
}