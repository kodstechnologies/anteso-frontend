import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

const Dashboard = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
    }, []);
    return (
        <div>Dashboard</div>
    )
}

export default Dashboard