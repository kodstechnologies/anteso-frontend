import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

type Props = {
    onClick: () => void;
};

export default function AnimatedTrashIcon({ onClick }: Props) {
    return (
        <motion.button
            whileHover={{ rotate: -10, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="text-red-500 hover:text-red-600"
        >
            <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                <Trash2 size={25} />
            </motion.div>
        </motion.button>
    );
}