// src/utils/errorHandler.js
export const handleDuplicateKeyError = (err) => {
    if (err.code === 11000) {
        const duplicateField = Object.keys(err.keyValue)[0];
        const value = err.keyValue[duplicateField];
        return `${duplicateField} "${value}" already exists. Please use a different one.`;
    }
    return 'An unexpected error occurred.';
};
