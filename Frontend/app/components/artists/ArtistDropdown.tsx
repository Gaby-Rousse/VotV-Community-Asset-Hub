import {useEffect, useRef, useState} from "react";
import type Artist from "~/models/interfaces/Artist";
import {apiCall} from "~/components/Functions";

export default function ArtistDropdown({onSelect, initialArtistId}: {
    onSelect: (id: number) => void;
    initialArtistId: number | null;
}) {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Artist | null>(null);
    const div = useRef<HTMLDivElement>(null);

    useEffect(() => {
        apiCall("/api/Artists", null)
            .then(res => res.json())
            .then(setArtists);
    }, []);

    useEffect(() => {
        if (initialArtistId && artists.length > 0 && !selected) {
            const initialArtist = artists.find(a => a.id === initialArtistId);
            if (initialArtist) {
                setSelected(initialArtist);
                setSearch(initialArtist.name);
            }
        }
    }, [initialArtistId, artists, selected]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (div.current && !div.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const filtered = artists.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    function Select(artist: Artist) {
        setSearch(artist.name);
        setSelected(artist);
        onSelect(artist.id);
        setIsOpen(false);
    }

    return (
        <div ref={div} className="relative w-full">
            <div className="relative">
                {selected && (
                    <img
                        className="absolute left-0.5 top-1/2 -translate-y-1/2 size-10 border-r dos pointer-events-none"
                        src={selected.pfpUrl}
                        alt={selected.name}
                    />
                )}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search artists..."
                    className={`w-full border bg-black dos p-2 ${selected ? 'pl-12' : ''}`}
                />
            </div>

            {isOpen && filtered.length > 0 ? (
                <div className="absolute z-50 w-full bg-black border border-t-0 max-h-60 overflow-y-auto">
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            onClick={() => Select(a)}
                            className="flex flex-row gap-1 line-clamp-1 h-12 border-b border-white items-center hover:cursor-pointer dos">
                            <img className="size-11.75" src={a.pfpUrl} alt="pfp"/>
                            {a.name}
                        </div>
                    ))}
                </div>
            ) : ("")}
        </div>
    );
}