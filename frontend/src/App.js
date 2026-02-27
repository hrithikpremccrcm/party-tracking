import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import StarsBackground from './components/StarsBackground';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import CalendarPage from './pages/CalendarPage';
import AdminUsersPage from './pages/AdminUsersPage';
import HolidaysPage from './pages/HolidaysPage';
import AdminCyclePage from './pages/AdminCyclePage';
import { useApp } from './context/AppContext';

const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin } = useApp();
  return isAdmin ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <StarsBackground />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin/users" element={
          <ProtectedAdminRoute><AdminUsersPage /></ProtectedAdminRoute>
        } />
        <Route path="/admin/holidays" element={
          <ProtectedAdminRoute><HolidaysPage /></ProtectedAdminRoute>
        } />
        <Route path="/admin/cycle" element={
          <ProtectedAdminRoute><AdminCyclePage /></ProtectedAdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
