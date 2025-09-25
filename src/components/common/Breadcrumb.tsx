import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    to?: string; // Optional: if omitted, it's treated as the current (active) page
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <ol className="flex items-center flex-wrap text-gray-500 font-semibold dark:text-white-dark gap-y-4 pb-2">
            {/* Render Home (or first item) */}
            {items.length > 0 && (
                <li>
                    {items[0].to ? (
                        <Link
                            to={items[0].to}
                            className="p-1.5 border border-gray-500/20 rounded-md shadow flex items-center justify-center dark:border-0 bg-white dark:bg-[#191e3a] hover:text-gray-500/70 dark:hover:text-white-dark/70"
                        >
                            {items[0].icon}
                        </Link>
                    ) : (
                        <span className="p-1.5 border border-gray-500/20 rounded-md shadow flex items-center justify-center text-primary dark:border-0 bg-white dark:bg-[#191e3a]">
                            {items[0].icon}
                        </span>
                    )}
                </li>
            )}

            {/* Render the rest */}
            {items.slice(1).map((item, index) => (
                <li
                    key={index}
                    className="flex items-center before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-2"
                >
                    {item.to ? (
                        <Link
                            to={item.to}
                            className="p-1.5 border border-gray-500/20 rounded-md shadow flex items-center justify-center text-primary dark:border-0 bg-white dark:bg-[#191e3a] hover:text-primary"
                        >
                            {item.icon && (
                                <span className="ltr:mr-2 rtl:ml-2 shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            {item.label}
                        </Link>
                    ) : (
                        <span className="p-1.5 border border-gray-500/20 rounded-md shadow flex items-center justify-center text-primary dark:border-0 bg-white dark:bg-[#191e3a]">
                            {item.icon && (
                                <span className="ltr:mr-2 rtl:ml-2 shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            {item.label}
                        </span>
                    )}
                </li>
            ))}
        </ol>
    );
};

export default Breadcrumb;
