import { Navigate, Outlet, useLocation } from "react-router-dom";

export const PublicRoute = () => {
  const token = localStorage.getItem('token');
  // 로그인 상태면 메인으로 튕겨냄
  return token ? <Navigate to="/app/chat" replace /> : <Outlet />;
};

export const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  // 비로그인 상태면 로그인 페이지로 튕겨냄
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};