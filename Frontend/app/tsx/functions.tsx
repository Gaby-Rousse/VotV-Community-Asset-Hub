import {
    FaArtstation,
    FaDeviantart,
    FaFacebookF,
    FaGithub,
    FaInstagram,
    FaReddit,
    FaTumblr,
    FaTwitch,
    FaYoutube
} from "react-icons/fa";
import {FaBluesky, FaPixiv, FaXTwitter} from "react-icons/fa6";
import {GiBattleTank} from "react-icons/gi";
import {CiGlobe} from "react-icons/ci";
import React from "react";

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
    let lowUrl = url.toLowerCase()
    let social = <a className="flex flex-row gap-1 dos"></a>
    if (lowUrl.includes("github.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaGithub className="dos my-auto"/>GitHub</a>
    else if (lowUrl.includes("deviantart.com"))
        social = <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaDeviantart
            className="dos my-auto"/>DeviantArt</a>
    else if (lowUrl.includes("bsky.app"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaBluesky className="dos my-auto"/>BlueSky</a>
    else if (lowUrl.includes("x.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaXTwitter className="dos my-auto"/>Twitter</a>
    else if (lowUrl.includes("tumblr.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaTumblr className="dos my-auto"/>Tumblr</a>
    else if (lowUrl.includes("facebook.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaFacebookF className="dos my-auto"/>Facebook</a>
    else if (lowUrl.includes("reddit.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaReddit className="dos my-auto"/>Reddit</a>
    else if (lowUrl.includes("newgrounds.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><GiBattleTank
                className="dos my-auto"/>NewGrounds</a>
    else if (lowUrl.includes("youtube.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaYoutube className="dos my-auto"/>YouTube</a>
    else if (lowUrl.includes("pixiv.net"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaPixiv className="dos my-auto"/>Pixiv</a>
    else if (lowUrl.includes("twitch.tv"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaTwitch className="dos my-auto"/>Twitch</a>
    else if (lowUrl.includes("instagram.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaInstagram className="dos my-auto"/>Instagram</a>
    else if (lowUrl.includes("artstation.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaArtstation
                className="dos my-auto"/>ArtStation</a>
    else
        social = <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><CiGlobe
            className="dos  my-auto"/><div className="dos truncate">{url}</div></a>
    return social
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