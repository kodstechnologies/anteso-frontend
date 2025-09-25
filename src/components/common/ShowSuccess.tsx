import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAlertProps {
    message: string;
    onClose?: () => void; // optional close handler
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose?.();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                        className="flex justify-center mb-4"
                    >
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <p className="text-center font-semibold text-lg">{message}</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SuccessAlert;
