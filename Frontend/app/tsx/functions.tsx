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

export async function apiCall(url: string, formData: FormData | null, method: string = "POST"): Promise<any> {

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
            className="dos my-auto"/>{url}</a>
    return social
}