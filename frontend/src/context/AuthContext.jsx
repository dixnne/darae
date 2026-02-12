import { createContext, useState } from 'react';
import { API_URL } from '../constants';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
    window.location.reload();
  };

  const isAuthenticated = !!(user?.id && token);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
