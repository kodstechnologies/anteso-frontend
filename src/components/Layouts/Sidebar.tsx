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
import Logo from '../../assets/logo/logo.png';
import IconMenuFontIcons from '../Icon/Menu/IconMenuFontIcons';
import IconBook from '../Icon/IconBook';
import IconBox from '../Icon/IconBox';
import IconUser from '../Icon/IconUser';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-5">
                        <NavLink to="/" className="main-logo flex items-center shrink-0 justify-center">
                            <img className="w-40" src={Logo} alt="logo" />
                            {/* <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">{t('anteso')}</span> */}
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
                                    <li className="nav-item">
                                        <NavLink to="/" className="group">
                                            <div className="flex items-center gap-2">
                                                <FiGrid className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Dashboard')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    {/* master */}
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
                                                {/* <li>
                                                    <NavLink to="/admin/state">{t('State')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/city">{t('City')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/items">{t('Items')}</NavLink>
                                                </li> */}
                                                <li>
                                                    <NavLink to="/admin/clients">{t('Clients')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/employee">{t('Employee')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/leave">{t('Leave')}</NavLink>
                                                </li>
                                                {/* <li>
                                                    <NavLink to="/admin/expenses">{t('Expenses')}</NavLink>
                                                </li> */}
                                                <li>
                                                    <NavLink to="/admin/tools">{t('Tools')}</NavLink>
                                                </li>
                                                {/* <li>
                                                    <NavLink to="/admin/dealer-and-manufacture">{t('Dealer And Manufacture')}</NavLink>
                                                </li> */}
                                                <li>
                                                    <NavLink to="/admin/dealer">{t('Dealer')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/manufacture">{t('Manufacture')}</NavLink>
                                                </li>

                                                {/* <li>
                                                    <NavLink to="/admin/services">{t('Services')}</NavLink>
                                                </li> */}
                                                <li>
                                                    <NavLink to="/admin/courier-companies">{t('Courier Companies')}</NavLink>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/admin/hrms" className="group">
                                            <div className="flex items-center gap-2">
                                                <IconUser className="group-hover:!text-primary shrink-0" />
                                                <span>{t('HRMS')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/admin/enquiry" className="group">
                                            <div className="flex items-center gap-2">
                                                <FiMessageSquare className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Enquiry')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    {/* <li className="nav-item">
                                        <NavLink to="/admin/quotation" className="group">
                                            <div className="flex items-center gap-2">
                                                <IconBox className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Quotation')}</span>
                                            </div>
                                        </NavLink>
                                    </li> */}
                                    <li className="nav-item">
                                        <NavLink to="/admin/orders" className="group">
                                            <div className="flex items-center gap-2">
                                                <IconBook className="group-hover:!text-primary shrink-0" />
                                                <span>{t('Orders')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
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
