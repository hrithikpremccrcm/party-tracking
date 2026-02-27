import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });
  const [selectedUser, setSelectedUser] = useState(() => {
    const saved = sessionStorage.getItem('selectedUser');
    return saved ? JSON.parse(saved) : null;
  });

  const loginAdmin = () => {
    setIsAdmin(true);
    sessionStorage.setItem('isAdmin', 'true');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  };

  const loginUser = (user) => {
    setSelectedUser(user);
    sessionStorage.setItem('selectedUser', JSON.stringify(user));
  };

  const logoutUser = () => {
    setSelectedUser(null);
    sessionStorage.removeItem('selectedUser');
  };

  return (
    <AppContext.Provider value={{
      isAdmin, loginAdmin, logoutAdmin,
      selectedUser, loginUser, logoutUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
