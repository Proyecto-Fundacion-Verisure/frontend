import { Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return <Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardPage />} /></Route></Routes>;
}
