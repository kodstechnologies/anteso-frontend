import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { IRootState } from '../../store';
interface AdminProtectedProps {
    children: ReactNode;
}

const AdminProtected: React.FC<AdminProtectedProps> = ({ children }) => {
    const isAuth = useSelector((state: IRootState) => state.userConfig.auth);
    const userType = useSelector((state: IRootState) => state.userConfig.userType);
    if (isAuth && userType == 'admin') {
        return children;
    } else {
        return <Navigate to="/login" />;
    }
};

export default AdminProtected;
