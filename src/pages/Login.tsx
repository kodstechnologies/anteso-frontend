import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../store/themeConfigSlice';
import IconMail from '../components/Icon/IconMail';
import IconLockDots from '../components/Icon/IconLockDots';
import { setUser } from '../store/userConfigSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { showMessage } from '../components/common/ShowMessage';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../assets/logo/logo-sm.png'
import { adminLogin } from '../api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
interface FormValues {
    email: string;
    password: string;
}
interface JwtPayload {
    id: string;
    email: string;
    role?: string;
    exp?: number;
}
const Login = () => {
    const dispatch = useDispatch();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Admin Login'));
    }, [dispatch]);
    const navigate = useNavigate();

    const loginSchema = Yup.object().shape({
        email: Yup.string().required('Required'),
        password: Yup.string().required('Required'),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: loginSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const response = await adminLogin(values);
                console.log("🚀 ~ onSubmit: ~ response:", response)
                if (response?.status === 200) {
                    const { accessToken, refreshToken } = response.data.data;

                    // Store tokens in cookies
                    Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
                    Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

                    // Decode accessToken to get role
                    const decoded: JwtPayload = jwtDecode<JwtPayload>(accessToken);
                    const userType = decoded.role || 'admin';

                    // Set Redux auth state
                    dispatch(
                        setUser({
                            auth: true,
                            userType,
                        })
                    );

                    showMessage('Logged in successfully');

                    // Navigate based on role
                    navigate(userType === 'admin' ? '/' : '/staff');
                } else {
                    showMessage('Invalid credentials', 'error');
                }
            } catch (err: any) {
                console.error('Login error:', err);
                showMessage(err?.response?.data?.message || 'Login failed', 'error');
            }
        }
    });
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[600px] py-20">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <img src={logo} alt="anteso logo" className="h-14 w-14 mx-auto mb-4" />
                                <h1 className="text-xl font-extrabold uppercase text-primary leading-snug">Sign in</h1>
                                <p className="text-base font-medium text-white-dark">Enter your email and password to login</p>
                            </div>

                            <form className="space-y-6 dark:text-white" onSubmit={formik.handleSubmit}>
                                <div>
                                    <label htmlFor="Email" className="block mb-1 font-semibold text-gray-700 dark:text-white">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            placeholder="Enter Email"
                                            className="form-input ps-10 placeholder:text-white-dark bg-white/90 dark:bg-black/40 shadow-md transition focus:ring-2 focus:ring-primary"
                                            {...formik.getFieldProps('email')}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <IconMail fill />
                                        </span>
                                    </div>
                                    {formik.touched.email && formik.errors.email && (
                                        <div className="text-danger mt-1">{formik.errors.email}</div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="Password" className="block mb-1 font-semibold text-gray-700 dark:text-white">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter Password"
                                            className="form-input ps-10 pe-10 placeholder:text-white-dark bg-white/90 dark:bg-black/40 shadow-md transition focus:ring-2 focus:ring-primary"
                                            {...formik.getFieldProps('password')}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <IconLockDots fill />
                                        </span>
                                        <span
                                            className="absolute end-4 top-1/2 -translate-y-1/2 cursor-pointer text-lg text-gray-500 hover:text-primary"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {formik.touched.password && formik.errors.password && (
                                        <div className="text-danger mt-1">{formik.errors.password}</div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-gradient mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                >
                                    Sign in
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
