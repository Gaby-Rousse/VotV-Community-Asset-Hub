import {createContext, useContext, useEffect, useState} from 'react';

const AuthContext = createContext({
    isAuthenticated: false, username: "", refreshAuth: () => {
    }
});

export const AuthProvider = ({children}: any) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("")

    useEffect(() => {
        checkAuth()
    }, []);

    function checkAuth() {
        fetch('http://10.0.0.131:5130/api/Accounts/status', {credentials: "include"})
            .then(res => res.json())
            .then(data => {
                setIsAuthenticated(data.isAuthenticated);
                setUsername(data.username);
            })
            .catch(() => setIsAuthenticated(false));
    }

    return (
        <AuthContext.Provider
            value={{isAuthenticated: isAuthenticated, username: username, refreshAuth: () => checkAuth()}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);