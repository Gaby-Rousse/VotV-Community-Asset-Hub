export default function VCBAdvertisement({isNavigating}: { isNavigating: boolean }) {
    return (
        <>
            <div className="flex my-auto flex-col">
                <div className="dos text-center">
                    {isNavigating ? ("Searching for audio or video?") : ("Want to add audio or video?")}
                </div>
                <div className="mx-auto flex flex-row gap-2 ">
                    <div className="dos">You should visit</div>
                    <a href="" target="_blank" className="title url text-center">VotV
                        Community Broadcaster
                    </a>
                    <div className="dos">!</div>
                </div>
                <div className="dos text-center">VotV Community Broadcaster is a website that stores video and audio
                    and streams
                    it over the internet for Voices of the Void players!
                </div>
                <div className="title text-center text-2xl">Screenshots</div>
                <div className="flex gap-5 md:gap-2 flex-col md:flex-row">
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_home.png"/>
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_upload.png?v=2"/>
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_ingame.png"/>
                </div>
                <a href="https://votvbroadcast.com/" target="_blank"
                   className="dos my-2 url border text-center p-2 mx-auto w-50">Visit
                    Now!</a>
            </div>

        </>
    )
}