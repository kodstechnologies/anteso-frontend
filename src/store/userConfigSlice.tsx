import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userType: '',
    auth: false,
    name: '',   
    email: '',
    department: '',
};

export const userConfigSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            const { userType, auth, name, email, department } = action.payload;
            state.userType = userType;
            state.auth = auth;
            state.name = name || '';
            state.email = email || '';
            state.department = department || '';
        },
        resetUser: () => initialState,
    },
});

export const { setUser, resetUser } = userConfigSlice.actions;

export default userConfigSlice.reducer;
