// utils/reportGenerator.js

const pad = (num, size) => {
    return num.toString().padStart(size, '0');
};

const getCurrentYearTwoDigit = () => {
    return new Date().getFullYear().toString().slice(-2);
};

const getCurrentMonthTwoDigit = () => {
    return pad(new Date().getMonth() + 1, 2);
};

// Example: simulate a sequence counter (replace with DB in production)
let sequenceCounter = 3182;

export function generateULRReportNumber() {
    const prefix = 'TC9843';
    const year = getCurrentYearTwoDigit();
    const sequence = pad(sequenceCounter, 9); // 9 digits
    return `${prefix}${year}${sequence}`;
}

export function generateQATestReportNumber() {
    const prefix = 'ABQAR';
    const year = getCurrentYearTwoDigit();
    const month = getCurrentMonthTwoDigit();
    const sequence = pad(sequenceCounter, 5); 
    return `${prefix}${year}${month}${sequence}`;
}

export function incrementSequence() {
    sequenceCounter++;
}