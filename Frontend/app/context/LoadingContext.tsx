import React, {createContext, useContext, useEffect, useState} from 'react';

const AuthContext = createContext({
    isLoading: false,
    setIsLoading: (value:boolean) => {},
});

export const LoadingProvider = ({children}: any) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <AuthContext.Provider
            value={{
                isLoading: isLoading,
                setIsLoading: setIsLoading,
            }}>
            {children}
            {isLoading ? (<LoadingOverlay/>) : ("")}
        </AuthContext.Provider>
    );
};

export const useLoading = () => useContext(AuthContext);

function LoadingOverlay()
{
    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 bg-black/50 z-10 ">
                <div className="flex gap-1 flex-row h-20 m-auto">
                    <img alt="" src="https://votvbroadcast.com/images/hourglass.gif"/>
                    <div className="dos text-xl my-auto">Loading...</div>
                </div>

            </div>
        </>
    )
}