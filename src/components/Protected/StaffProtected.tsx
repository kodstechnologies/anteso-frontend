import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { IRootState } from '../../store';

interface StaffProtectedProps {
    children: ReactNode;
}


const StaffProtected: React.FC<StaffProtectedProps> = ({ children }) => {
    const isAuth = useSelector((state: IRootState) => state.userConfig.auth);
    const userType = useSelector((state: IRootState) => state.userConfig.userType);
    if (isAuth && userType == 'staff') {
        return children;
    } else {
        return <Navigate to="/login" />;
    }
};

export default StaffProtected