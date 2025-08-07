// components/Loader.tsx
import React from 'react';

const Loader = ({ message = "Loading..." }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40">
            <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold">{message}</p>
        </div>
    );
};

export default Loader;
