import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {useAuth} from "~/context/AuthContext";

const ConsentContext = createContext<() => Promise<boolean>>(async () => false);

export function ConsentProvider({ children }: { children: ReactNode }) {
    const { explicitConsent, refreshAuth } = useAuth();
    const [open, setOpen] = useState(false);
    const resolve = useRef<((ok: boolean) => void) | null>(null);
    const requestConsent = () => {
        if (explicitConsent) return Promise.resolve(true);
        setOpen(true);
        return new Promise<boolean>((r) => (resolve.current = r));
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const endpoint = "/api/Accounts/explicit-consent"
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const answer = async (ok: boolean) => {
        if (ok) {
            const res = await fetch(url, { method: "POST", credentials: "include" });
            ok = res.ok;
            if (ok) await refreshAuth();
        }
        setOpen(false);
        resolve.current?.(ok);
    };

    return (
        <ConsentContext.Provider value={requestConsent}>
            {children}
            {open && createPortal(
                <div className="fixed text-xl dos inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="lg:w-1/2 px-2 w-full flex flex-col gap-10 bg-black p-8 border-2 border-white">
                        <div> Explicit content is restricted to users 18 or older.
                            By continuing, you confirm that you are at least 18 years old.</div>
                        <div className="flex flex-row justify-between">
                        <button className="border-2 px-4 py-2" onClick={() => answer(false)}>Cancel</button>
                        <button className="border-2 px-4 py-2" onClick={() => answer(true)}>I am 18 or older</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </ConsentContext.Provider>
    );
}

export const useConsent = () => useContext(ConsentContext);