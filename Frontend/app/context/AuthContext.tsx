import {createContext, useContext, useEffect, useState} from 'react';

const AuthContext = createContext({isAuthenticated: false});

export const AuthProvider = ({children}: any) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        fetch('/api/Accounts/status')
            .then(res => res.json())
            .then(data => setIsAuthenticated(data.isAuthenticated))
            .catch(() => setIsAuthenticated(false));
    }, []);

    return (
        <AuthContext.Provider value={{isAuthenticated}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);