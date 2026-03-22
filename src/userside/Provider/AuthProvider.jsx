import { createContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser)); 
        }
    }, []);

    const login = (authToken) => {
        const decodedUser = jwtDecode(authToken);
        
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("authUser", JSON.stringify(decodedUser)); 

        setToken(authToken);
        setUser(decodedUser);
    };

    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");

        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};
