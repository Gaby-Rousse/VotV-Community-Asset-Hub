import {Nav} from "~/routes/_index";

export default function changelog()
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
                        <li>Make a better UI for mobile users</li>
                        <li>Add suggestions page</li>
                        <li>Add bug report page</li>
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