import {
    FaArtstation,
    FaDeviantart, FaDiscord,
    FaFacebookF,
    FaGithub,
    FaInstagram,
    FaReddit, FaSpotify, FaSteam,
    FaTumblr,
    FaTwitch, FaTwitter, FaWikipediaW,
    FaYoutube
} from "react-icons/fa";
import {FaBluesky, FaPixiv, FaTiktok, FaVk, FaXTwitter} from "react-icons/fa6";
import {GiBattleTank} from "react-icons/gi";
import {CiGlobe} from "react-icons/ci";
import ItemEnum from "~/models/enums/ItemEnum";
import TypeEnum from "~/models/enums/TypeEnum";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export async function apiCall(endpoint: string, formData: FormData | null, method: string = "POST"): Promise<any> {

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    if (formData != null) {
        return await fetch(url, {
            credentials: "include",
            method: method,
            body: formData,
        });
    } else {
        return await fetch(url, {credentials: "include"});
    }

}

export function GenerateSocial({url}: { url: string }) {
    const lowUrl = url.toLowerCase();

    const socialDB = [
        { domain: "github.com", icon: FaGithub, label: "GitHub" },
        { domain: "deviantart.com", icon: FaDeviantart, label: "DeviantArt" },
        { domain: "bsky.app", icon: FaBluesky, label: "BlueSky" },
        { domain: "x.com", icon: FaXTwitter, label: "Twitter" },
        { domain: "twitter.com", icon: FaTwitter, label: "Twitter" },
        { domain: "tumblr.com", icon: FaTumblr, label: "Tumblr" },
        { domain: "facebook.com", icon: FaFacebookF, label: "Facebook" },
        { domain: "reddit.com", icon: FaReddit, label: "Reddit" },
        { domain: "newgrounds.com", icon: GiBattleTank, label: "NewGrounds" },
        { domain: "youtube.com", icon: FaYoutube, label: "YouTube" },
        { domain: "pixiv.net", icon: FaPixiv, label: "Pixiv" },
        { domain: "twitch.tv", icon: FaTwitch, label: "Twitch" },
        { domain: "instagram.com", icon: FaInstagram, label: "Instagram" },
        { domain: "artstation.com", icon: FaArtstation, label: "ArtStation" },
        { domain: "discord.com", icon: FaDiscord, label: "Discord" },
        { domain: "discord.gg", icon: FaDiscord, label: "Discord" },
        { domain: "spotify.com", icon: FaSpotify, label: "Spotify" },
        { domain: "steamcommunity.com", icon: FaSteam, label: "Steam" },
        { domain: "wikipedia.org", icon: FaWikipediaW, label: "Wikipedia" },
        { domain: "vk.com", icon: FaVk, label: "VK" },
        { domain: "tiktok.com", icon: FaTiktok, label: "TikTok" },
    ];

    const social = socialDB.find(social => lowUrl.includes(social.domain));

    if (social) {
        const Icon = social.icon;
        return (
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos">
                <Icon className="dos my-auto" />
                {social.label}
            </a>
        );
    }

    //Fallback (globe)
    return (
        <a target="_blank" href={url} className="flex url flex-row gap-1 dos">
            <CiGlobe className="dos shrink-0 my-auto" />
            <div className="dos url truncate">{url}</div>
        </a>
    );
}
export async function downloadFile(url: string, filename: string) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        const forcedBlob = new Blob([blob], {type: 'application/octet-stream'});
        const blobUrl = window.URL.createObjectURL(forcedBlob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
    } catch (error) {
        console.error('Download failed:', error);
    }
}

export function selectAspectRatio({item, type} : {item : number, type : number | undefined}) : string {
    if(item == ItemEnum.Poster)
        return "h-60 aspect-2/3"
    if(item == ItemEnum.Picture)
    {
        if(type == TypeEnum.Horizontal)
            return "h-50 aspect-5/4"
        if(type == TypeEnum.Square)
            return "h-50 aspect-1/1"
        if(type == TypeEnum.Vertical)
            return "h-50 aspect-5/8"
        if(type == TypeEnum.Table)
            return "h-50 aspect-3/4"
    }
    return "h-50 aspect-1/1"
}

export function humanDate(date: string): string {
    let newDate = new Date(date);
    return newDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}