import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userType: '',
    auth: false,
};

export const userConfigSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            const { userType, auth } = action.payload;
            state.userType = userType;
            state.auth = auth;
        },
        resetUser: () => initialState,
    },
});

export const { setUser, resetUser } = userConfigSlice.actions;

export default userConfigSlice.reducer;
