import React from 'react';
import { CheckCircleIcon, LockClosedIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const Terms = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-gray-800 leading-relaxed border border-blue-100">

                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-blue-900 mb-2">ANTESO Biomedical Terms & Conditions</h1>
                    <p className="text-sm text-gray-600 font-medium">
                        Last Updated: October 15, 2025
                    </p>
                </header>

                {/* Intro */}
                <div className="space-y-5 mb-10 text-lg">
                    <p>
                        Anteso Biomedical (OPC) Private Limited (“Company”, “we”, “our”, or “us”), a company incorporated under the Companies Act, 2013, with its registered office at Flat No. 290, 2nd Floor, D Block, Pocket 7, Sector 6, Rohini, New Delhi – 110085, India, operates the ANTESO mobile application (the “App”).
                    </p>
                    <p>
                        These Terms & Conditions (“Terms”) govern your access to and use of the App, including all services, features, and content provided through it (collectively, the “Services”). The App is specifically designed for Quality Assurance (QA) testing of radiology equipment in compliance with the guidelines issued by the Atomic Energy Regulatory Board (AERB).
                    </p>
                    <p className="font-medium text-gray-700">
                        By downloading, installing, registering for, or using the App, you agree to be bound by these Terms, our Privacy Policy, and all applicable laws. If you do not agree, you must not use the App.
                    </p>
                </div>

                <hr className="my-12 border-gray-300" />

                {/* Section 1 - Eligibility */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">1</span> Eligibility
                    </h2>
                    <ul className="space-y-3">
                        {[
                            "You must be at least 18 years old and legally competent to enter into binding agreements.",
                            "The App is intended exclusively for licensed medical professionals, radiologists, biomedical engineers, and authorized healthcare personnel complying with AERB regulations.",
                            "Government entities, competitors, or unauthorized individuals are strictly prohibited from using the App."
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Section 2 - User Registration */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">2</span> User Registration & Accounts
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>You must create an account using accurate and complete details.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>
                                You are solely responsible for maintaining confidentiality of your login credentials and must notify us immediately of any unauthorized use via{' '}
                                <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">
                                    antesobiomedical.2014@gmail.com
                                </a>.
                            </span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>We may suspend or terminate accounts for violations, misuse, or non-compliance with AERB regulations.</span>
                        </li>
                    </ul>
                </section>

                {/* Section 3 - Services */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">3</span> Services Description
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>QA Testing Tools</strong> – measurement and validation of radiology equipment parameters.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Report Generation</strong> – creation of AERB-compliant QA certificates and test reports.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Data Management</strong> – secure storage and retrieval of test results and logs.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Compliance Tracking</strong> – tracking of audit trails and certifications.</span>
                        </li>
                    </ul>
                    <p className="mt-4 italic text-gray-600">All Services are provided on an “as is” basis and may be updated at our discretion.</p>
                </section>

                {/* Section 4 - User Obligations */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">4</span> User Obligations & Responsibilities
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                                <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                                a. Compliance Requirements
                            </h3>
                            <ul className="space-y-2 ml-8">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Users must possess valid AERB authorization or institutional approvals.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>All QA testing must adhere to AERB Safety Code SC/MED-2 and other relevant guidelines.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Users are responsible for data accuracy and regulatory compliance.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                                b. Prohibited Conduct
                            </h3>
                            <ul className="space-y-2 ml-8">
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">X</span>
                                    <span>Uploading falsified or misleading data.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">X</span>
                                    <span>Reverse engineering or extracting source code.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">X</span>
                                    <span>Using the App for non-QA or resale purposes.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">X</span>
                                    <span>Interfering with system functionality or sharing unauthorized access.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                                <LockClosedIcon className="h-6 w-6 text-yellow-600 mr-2" />
                                c. Equipment & Data Accuracy
                            </h3>
                            <p className="ml-8 text-gray-700">
                                You are responsible for ensuring equipment data accuracy. The Company shall not be held liable for errors resulting from incorrect input or equipment malfunction.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 5 - IP Rights */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">5</span> Intellectual Property Rights
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">a. Company IP</h3>
                            <ul className="space-y-2 ml-6">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>The App and all related content are the exclusive property of the Company.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>You are granted a limited, non-transferable, revocable license for QA purposes only.</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">b. User Content</h3>
                            <ul className="space-y-2 ml-6">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>You retain ownership of uploaded data, granting the Company a license to process and display it.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>All uploaded content must comply with AERB standards.</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">c. Generated Reports</h3>
                            <ul className="space-y-2 ml-6">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Reports generated are co-owned by you and the Company.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Redistribution or resale requires written consent.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 6 - Fees */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">6</span> Fees & Payment
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>Services may be subscription or per-test based. Fees are non-refundable unless required by law.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>Users are responsible for all taxes and timely payments.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>Overdue payments incur interest up to 1.5% per month.</span>
                        </li>
                    </ul>
                </section>

                {/* Section 7 - Data */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">7</span> Data Ownership & Privacy
                    </h2>
                    <p className="ml-8 text-gray-700">
                        You retain ownership of your input data. Our Privacy Policy governs data handling, storage, and compliance with AERB record-keeping requirements.
                    </p>
                </section>

                {/* Section 8 - Warranties */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">8</span> Warranties & Disclaimers
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>The App is provided “as is” and not intended for diagnosis or treatment.</span>
                        </li>
                        <li className="flex items-start">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>We are not responsible for equipment failures or external conditions beyond our control.</span>
                        </li>
                    </ul>
                </section>

                {/* Section 9 - Liability */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">9</span> Limitation of Liability
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>Liability is limited to fees paid in the last 12 months.</span>
                        </li>
                        <li className="flex items-start">
                            <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>No responsibility for indirect, incidental, or consequential damages.</span>
                        </li>
                    </ul>
                </section>

                {/* Section 10 - Termination */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">10</span> Termination
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>You may terminate your account anytime via email or App settings.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>We may suspend accounts for breaches, non-payment, or regulatory violations.</span>
                        </li>
                    </ul>
                </section>

                {/* Section 11 - Indemnification */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">11</span> Indemnification
                    </h2>
                    <p className="ml-8 text-gray-700">
                        You agree to indemnify and hold harmless the Company against any claims arising from violations of these Terms, inaccurate data, or non-compliance with AERB regulations.
                    </p>
                </section>

                {/* Section 12 - Governing Law */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">12</span> Governing Law & Dispute Resolution
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Governing Law:</strong> India</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Jurisdiction:</strong> Courts in New Delhi</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Arbitration:</strong> Conducted under the Arbitration and Conciliation Act, 1996</span>
                        </li>
                    </ul>
                </section>

                {/* Section 13 - Third Party */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">13</span> Third-Party Services
                    </h2>
                    <p className="ml-8 text-gray-700">
                        The App may integrate with third-party tools. Their respective terms apply independently.
                    </p>
                </section>

                {/* Section 14 - Updates */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">14</span> Updates & Modifications
                    </h2>
                    <p className="ml-8 text-gray-700">
                        We may update these Terms at any time. Continued use after updates constitutes acceptance.
                    </p>
                </section>

                {/* Section 15 - Miscellaneous */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
                        <span className="mr-3 text-blue-600">15</span> Miscellaneous
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>These Terms, along with the Privacy Policy, form the complete agreement.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>Invalid provisions do not affect remaining terms.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span>
                                Contact:{' '}
                                <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">
                                    antesobiomedical.2014@gmail.com
                                </a>
                            </span>
                        </li>
                    </ul>
                </section>

                {/* Footer */}
                <footer className="text-center text-sm text-gray-500 mt-16 pt-8 border-t border-gray-200">
                    © {new Date().getFullYear()} Anteso Biomedical (OPC) Private Limited. All Rights Reserved.
                </footer>
            </div>
        </div>
    );
};

export default Terms;