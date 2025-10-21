import { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { showMessage } from "../components/common/ShowMessage";
import IconMail from "../components/Icon/IconMail";
import IconLockDots from "../components/Icon/IconLockDots";
import logo from "../assets/logo/logo-sm.png";
import { setPageTitle } from "../store/themeConfigSlice";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { sendOTp, verifyOtp, resetPassword } from "../api/index";

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [step, setStep] = useState<"phone" | "otp" | "reset">("phone");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");

    // Resend OTP state
    const [timer, setTimer] = useState(60);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        dispatch(setPageTitle("Forgot Password"));
    }, [dispatch]);

    useEffect(() => {
        if (step === "otp") startTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [step]);


    const startTimer = () => {
        setTimer(60);

        // Clear existing interval
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = window.setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };


    const getMaskedPhone = (phone: string) => {
        if (phone.length !== 10) return phone;
        return `****${phone.slice(-4)}`;
    };

    // ----------------- Step 1: Phone Form -----------------
    const phoneFormik = useFormik({
        initialValues: { phone: "" },
        validationSchema: Yup.object({
            phone: Yup.string()
                .matches(/^[0-9]{10}$/, "Enter a valid 10-digit number")
                .required("Phone number is required"),
        }),
        onSubmit: async (values) => {
            try {
                setLoading(true);
                await sendOTp(values.phone);
                setPhoneNumber(values.phone);
                const maskedPhone = getMaskedPhone(values.phone);
                showMessage(`OTP sent to ${maskedPhone}`);
                setStep("otp");
            } catch (error: any) {
                let errorMessage = "Failed to send OTP. Please try again.";
                if (error.response?.status === 404) {
                    errorMessage = "Phone number not found";
                } else {
                    errorMessage = error?.message || errorMessage;
                }
                showMessage(errorMessage, "error");
            } finally {
                setLoading(false);
            }
        },
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        phoneFormik.setFieldValue("phone", value);
    };

    // ----------------- Step 2: OTP Verification -----------------
    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            const next = document.getElementById(`otp-${index + 1}`);
            next?.focus();
        }
    };

    const verifyOtpFunc = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            showMessage("Please enter a valid 6-digit OTP", "error");
            return;
        }
        try {
            setLoading(true);
            await verifyOtp(phoneNumber, enteredOtp);
            showMessage("OTP verified successfully");
            setStep("reset");
        } catch (error: any) {
            let errorMessage = "Invalid OTP. Please try again.";
            if (error.response?.status === 400) {
                errorMessage = error?.response?.data?.message || "Invalid OTP entered. Please check and try again.";
            } else {
                errorMessage = error?.message || errorMessage;
            }
            showMessage(errorMessage, "error");
            setOtp(["", "", "", "", "", ""]);
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        if (!phoneNumber) return;
        try {
            setLoading(true);
            await sendOTp(phoneNumber);
            const maskedPhone = getMaskedPhone(phoneNumber);
            showMessage(`OTP resent to ${maskedPhone}`);
            setOtp(["", "", "", "", "", ""]);
            startTimer();
        } catch (error: any) {
            let errorMessage = "Failed to resend OTP. Please try again.";
            if (error.response?.status === 404) {
                errorMessage = "Phone number not found";
            } else {
                errorMessage = error?.message || errorMessage;
            }
            showMessage(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    // ----------------- Step 3: Reset Password -----------------
    const resetFormik = useFormik({
        initialValues: { password: "", confirmPassword: "" },
        validationSchema: Yup.object({
            password: Yup.string()
                .min(6, "Password must be at least 6 characters")
                .required("Required"),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords must match")
                .required("Required"),
        }),
        onSubmit: async (values) => {
            try {
                setLoading(true);
                await resetPassword(phoneNumber, values.password);
                showMessage("Password reset successfully");
                navigate("/login");
            } catch (error: any) {
                showMessage(error?.message || "Failed to reset password. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        },
    });

    const maskedPhone = getMaskedPhone(phoneNumber);

    return (
        <div>
            <div className="absolute inset-0">
                <img
                    src="/assets/images/auth/bg-gradient.png"
                    alt="background"
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative w-full max-w-[870px] rounded-md p-2">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[600px] py-20">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <img
                                    src={logo}
                                    alt="logo"
                                    className="h-14 w-14 mx-auto mb-4"
                                />
                                <h1 className="text-xl font-extrabold uppercase text-primary leading-snug">
                                    Forgot Password
                                </h1>
                                <p className="text-base font-medium text-white-dark">
                                    {step === "phone"
                                        ? "Enter your registered phone number"
                                        : step === "otp"
                                            ? `Enter the OTP sent to ${maskedPhone}`
                                            : "Set your new password"}
                                </p>
                            </div>
                            {/* STEP 1: Enter Phone */}
                            {step === "phone" && (
                                <form
                                    className="space-y-6 dark:text-white"
                                    onSubmit={phoneFormik.handleSubmit}
                                >
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="block mb-1 font-semibold text-gray-700 dark:text-white"
                                        >
                                            Phone Number
                                        </label>
                                        <div className="relative text-white-dark">
                                            <input
                                                id="phone"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="Enter phone number"
                                                className="form-input ps-10 placeholder:text-white-dark bg-white/90 dark:bg-black/40 shadow-md transition focus:ring-2 focus:ring-primary"
                                                {...phoneFormik.getFieldProps("phone")}
                                                onChange={handlePhoneChange}
                                                disabled={loading}
                                            />
                                            <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <IconMail fill />
                                            </span>
                                        </div>
                                        {phoneFormik.touched.phone && phoneFormik.errors.phone && (
                                            <div className="text-danger mt-1">
                                                {phoneFormik.errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-gradient mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] hover:shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        {loading ? "Sending..." : "Send OTP"}
                                    </button>
                                </form>
                            )}
                            {/* STEP 2: OTP Input */}
                            {step === "otp" && (
                                <div className="dark:text-white text-center">
                                    <p className="mb-4 text-white-dark">
                                        Please enter the 6-digit OTP sent to {maskedPhone}
                                    </p>
                                    <div className="flex justify-center gap-2 mb-4">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                id={`otp-${i}`}
                                                type="password"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(e.target.value, i)}
                                                className="w-10 h-12 text-center border rounded-md bg-white/90 dark:bg-black/40 text-lg font-semibold focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={verifyOtpFunc}
                                        disabled={loading || otp.join("").length !== 6}
                                        className="btn btn-gradient w-full uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] hover:shadow-lg transition-transform hover:-translate-y-0.5 mb-3 disabled:opacity-50"
                                    >
                                        {loading ? "Verifying..." : "Verify OTP"}
                                    </button>

                                    <button
                                        disabled={timer > 0 || loading}
                                        onClick={resendOtp}
                                        className={`mt-2 text-sm font-medium ${timer > 0 || loading ? "text-gray-400 cursor-not-allowed" : "text-primary hover:underline"
                                            }`}
                                    >
                                        {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                                    </button>
                                </div>
                            )}

                            {/* STEP 3: Reset Password */}
                            {step === "reset" && (
                                <form
                                    className="space-y-6 dark:text-white"
                                    onSubmit={resetFormik.handleSubmit}
                                >
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block mb-1 font-semibold text-gray-700 dark:text-white"
                                        >
                                            New Password
                                        </label>
                                        <div className="relative text-white-dark">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                className="form-input ps-10 pe-10 placeholder:text-white-dark bg-white/90 dark:bg-black/40 shadow-md transition focus:ring-2 focus:ring-primary"
                                                {...resetFormik.getFieldProps("password")}
                                                disabled={loading}
                                            />
                                            <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <IconLockDots fill />
                                            </span>
                                            <span
                                                className="absolute end-4 top-1/2 -translate-y-1/2 cursor-pointer text-lg text-gray-500 hover:text-primary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                        {resetFormik.touched.password &&
                                            resetFormik.errors.password && (
                                                <div className="text-danger mt-1">
                                                    {resetFormik.errors.password}
                                                </div>
                                            )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block mb-1 font-semibold text-gray-700 dark:text-white"
                                        >
                                            Confirm Password
                                        </label>
                                        <div className="relative text-white-dark">
                                            <input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm password"
                                                className="form-input ps-10 placeholder:text-white-dark bg-white/90 dark:bg-black/40 shadow-md transition focus:ring-2 focus:ring-primary"
                                                {...resetFormik.getFieldProps("confirmPassword")}
                                                disabled={loading}
                                            />
                                            <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <IconLockDots fill />
                                            </span>
                                        </div>
                                        {resetFormik.touched.confirmPassword &&
                                            resetFormik.errors.confirmPassword && (
                                                <div className="text-danger mt-1">
                                                    {resetFormik.errors.confirmPassword}
                                                </div>
                                            )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-gradient mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] hover:shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        {loading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;