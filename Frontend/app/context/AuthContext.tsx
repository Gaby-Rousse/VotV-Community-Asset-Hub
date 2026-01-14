import {createContext, useContext, useEffect, useState} from 'react';

const AuthContext = createContext({
    isAuthenticated: false,
    username: "",
    refreshAuth: () => {
    },
    id: "",
    isAdmin: false,
});

export const AuthProvider = ({children}: any) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAuth()
    }, []);

    function checkAuth() {
        fetch('http://10.0.0.131:5130/api/Accounts/status', {credentials: "include"})
            .then(res => res.json())
            .then(data => {
                setIsAuthenticated(data.isAuthenticated);
                setUsername(data.username);
                setId(data.id);
                setIsAdmin(data.isAdmin || false);
            })
            .catch(() => {
                setIsAuthenticated(false);
                setIsAdmin(false);
            });
    }

    return (
        <AuthContext.Provider
            value={{
                id: id,
                isAdmin: isAdmin,
                isAuthenticated: isAuthenticated,
                username: username,
                refreshAuth: () => checkAuth()
            }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);