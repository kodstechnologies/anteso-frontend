import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import {
    FiBook,
    FiBox,
    FiCreditCard,
    FiDollarSign,
    FiFileText,
    FiGift,
    FiGrid,
    FiMessageSquare,
    FiPlusSquare,
    FiSettings,
    FiShoppingBag,
    FiShoppingCart,
    FiSquare,
    FiUsers,
    FiVideo,
} from 'react-icons/fi';
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import Logo from '../../assets/logo/logo.png';
import IconMenuFontIcons from '../Icon/Menu/IconMenuFontIcons';
import IconBook from '../Icon/IconBook';
import IconBox from '../Icon/IconBox';
import IconUser from '../Icon/IconUser';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const userType = useSelector((state: IRootState) => state.userConfig.userType);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => (oldValue === value ? '' : value));
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-5">
                        <NavLink to="/" className="main-logo flex items-center shrink-0 justify-center">
                            <img className="w-40" src={Logo} alt="logo" />
                        </NavLink>
                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>

                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="nav-item">
                                <ul>
                                    {/* Dashboard */}
                                    <li className="nav-item">
                                        <NavLink to="/" className="group">
                                            <div className="flex items-center gap-2">
                                                <FiGrid className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Dashboard')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    {/* Master Menu (shared but items inside differ) */}
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'masters' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('masters')}>
                                            <div className="flex items-center gap-2">
                                                <FiUsers className="text-xl" />
                                                <span>{t('Master')}</span>
                                            </div>
                                            <div className={currentMenu !== 'masters' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'masters' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li><NavLink to="/admin/clients">{t('Clients')}</NavLink></li>

                                                {userType === 'admin' && (
                                                    <>
                                                        <li><NavLink to="/admin/employee">{t('Employee')}</NavLink></li>
                                                        <li><NavLink to="/admin/tools">{t('Tools')}</NavLink></li>
                                                    </>
                                                )}

                                                <li><NavLink to="/admin/leave">{t('Leave')}</NavLink></li>
                                                <li><NavLink to="/admin/dealer">{t('Dealer')}</NavLink></li>
                                                <li><NavLink to="/admin/manufacture">{t('Manufacture')}</NavLink></li>
                                                <li><NavLink to="/admin/courier-companies">{t('Courier Companies')}</NavLink></li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>

                                    {/* Admin only: HRMS */}
                                    {userType === 'admin' && (
                                        // <li className="nav-item">
                                        //     <NavLink to="/admin/hrms" className="group">
                                        //         <div className="flex items-center gap-2">
                                        //             <IconUser className="group-hover:!text-primary shrink-0" />
                                        //             <span>{t('HRMS')}</span>
                                        //         </div>
                                        //     </NavLink>
                                        // </li>
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'hrms' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('hrms')}>
                                                <div className="flex items-center gap-2">
                                                    <FiUsers className="text-xl" />
                                                    <span>{t('HRMS')}</span>
                                                </div>
                                                <div className={currentMenu !== 'hrms' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'hrms' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">

                                                    {userType === 'admin' && (
                                                        <>
                                                            <li><NavLink to="/admin/hrms/leave-management">{t('Leave Management')}</NavLink></li>
                                                            <li><NavLink to="/admin/hrms/trip-management">{t('Trip Management')}</NavLink></li>
                                                            <li><NavLink to="/admin/hrms/salary-management">{t('Salary Management')}</NavLink></li>
                                                            <li><NavLink to="/admin/hrms/attendance-summary">{t('Attendance Summary')}</NavLink></li>
                                                            {/* <li><NavLink to="/admin/hrms/trip-management">{t('Trip Management')}</NavLink></li> */}
                                                        </>
                                                    )}
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* Shared */}
                                    <li className="nav-item">
                                        <NavLink to="/admin/enquiry" className="group">
                                            <div className="flex items-center gap-2">
                                                <FiMessageSquare className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Enquiry')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/admin/orders" className="group">
                                            <div className="flex items-center gap-2">
                                                <IconBook className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Orders')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    {/* Admin only: Accounts */}
                                    {userType === 'admin' && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'accounts' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('accounts')}>
                                                <div className="flex items-center gap-2">
                                                    <RiMoneyRupeeCircleLine className="text-xl" />
                                                    <span>{t('Accounts')}</span>
                                                </div>
                                                <div className={currentMenu !== 'accounts' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'accounts' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li><NavLink to="/admin/payments">{t('Payments')}</NavLink></li>
                                                    <li><NavLink to="/admin/invoice">{t('Invoice')}</NavLink></li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}
                                </ul>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
