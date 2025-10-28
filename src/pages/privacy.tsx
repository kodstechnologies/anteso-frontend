import React from 'react';
import { CheckCircleIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-gray-800 leading-relaxed border border-blue-100">

                {/* Title & Last Updated */}
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-blue-900 mb-2">ANTESO Biomedical Privacy Policy</h1>
                    <p className="text-sm text-gray-600 font-medium">
                        <strong>Last Updated:</strong> October 15, 2025
                    </p>
                </header>

                {/* Intro Paragraphs */}
                <div className="space-y-6 mb-10 text-lg">
                    <p>
                        Anteso Biomedical (OPC) Private Limited (<strong>"Company"</strong>, <strong>"we"</strong>, <strong>"our"</strong>, or <strong>"us"</strong>) operates the ANTESO mobile application (the <strong>"App"</strong>). This Privacy Policy describes how we collect, use, store, share, and protect your personal information when you use our App.
                    </p>
                    <p>
                        <strong className="text-blue-800">Legal Compliance:</strong> We comply with the Digital Personal Data Protection Act, 2023 (DPDP Act), Information Technology Act, 2000, and AERB guidelines. As a Data Fiduciary under DPDP Act, we are responsible for processing your personal data lawfully and securely.
                    </p>
                    <p className="font-medium text-gray-700">
                        By accessing or using the App, you consent to the practices described herein.
                    </p>
                </div>

                <hr className="my-12 border-gray-300" />

                {/* Section 1 */}
                <section className="mb-12 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4">1. Company Information</h2>
                    <div className="space-y-3 text-gray-700">
                        <p>
                            <strong>Anteso Biomedical (OPC) Private Limited</strong><br />
                            Flat No. 290, 2nd Floor, D Block, Pocket 7, Sector 6, Rohini, New Delhi – 110 085, India
                        </p>
                        <p><strong>Contact:</strong> antesobiomedical.2014@gmail.com | +91 84709 09720</p>
                        <p><strong>Grievance Officer:</strong> Same contact details (DPDP Act requirement)</p>
                        <p className="mt-4">
                            We specialise in conducting Quality Assurance (QA) testing of radiology equipment in compliance with the guidelines of the Atomic Energy Regulatory Board (AERB).
                        </p>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-6">2. Information We Collect</h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">a. Personal Information</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-6">
                                <li>Full Name, Email Address, Contact Number, and Organization Name</li>
                                <li>User Credentials and Authentication Data</li>
                                <li>Professional Qualifications (as required for AERB compliance)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">b. Sensitive Technical Data</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-6">
                                <li>Equipment parameters: Radiation dosage, calibration data, and related technical specifications</li>
                                <li>QA test results: Image quality metrics, safety parameters, and performance verification data.</li>
                                <li>Medical facility details: License numbers, AERB approvals, and other regulatory identifiers.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">c. Device & Usage Data</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-6">
                                <li>Device identifiers, IP address, OS version</li>
                                <li>App usage logs, crash reports</li>
                                <li>Location data (with explicit consent for field testing)</li>
                            </ul>
                        </div>
                        <div className="mt-6 p-5 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg font-medium text-amber-900">
                            <strong>Data Minimization:</strong> data strictly necessary for AERB-compliant QA testing, regulatory reporting, and the efficient execution of services shall be collected, processed, and maintained in accordance with applicable regulatory and organizational standards.
                        </div>
                    </div>
                </section>

                {/* Section 3 - Lawful Basis */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">3. Lawful Basis for Processing</h2>
                    <p className="mb-4">We process personal and technical data on the following lawful bases:</p>
                    <ul className="space-y-4">
                        {[
                            { label: "Contract", desc: "To provide QA services, generate reports, and fulfill obligations under service agreements." },
                            { label: "Legal Obligation", desc: "To comply with AERB regulations and other statutory record-keeping requirements." },
                            { label: "Legitimate Interest", desc: "To ensure proper functioning of applications, monitor system security, and improve operational efficiency." },
                            { label: "Explicit Consent", desc: "For processing location data, marketing communications, or any other activities requiring clear user consent." }
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                <span><strong>{item.label}:</strong> {item.desc}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All data processing activities are conducted in accordance with applicable regulatory frameworks and organizational policies.
                    </p>
                </section>

                {/* Section 4 - Consent Management */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">4. Consent Management</h2>
                    <p className="mb-4">We ensure that user consent is obtained, managed, and respected in accordance with applicable data protection laws:</p>
                    <ul className="space-y-4">
                        {[
                            "Granular Consent: Separate permissions are obtained for different types of data and processing activities.",
                            "Easy Withdrawal: Users may withdraw consent at any time via the application settings or by contacting us via email.",
                            "Consent Records: Verifiable records of consent are maintained for accountability and compliance purposes.",
                            "No Penalty: Withdrawal of consent will not affect any data processing that was lawful prior to the withdrawal."
                        ].map((text, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                <span><strong>{text.split(':')[0]}:</strong> {text.split(':')[1]}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All consent management practices are designed to uphold user rights and ensure transparency in data processing activities.
                    </p>
                </section>

                {/* Section 5 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">5. How We Use Your Information</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 pl-6">
                        <li>Generate AERB-compliant QA certificates and reports</li>
                        <li>Perform equipment calibration and safety validation</li>
                        <li>Manage user authentication and access</li>
                        <li>Maintain regulatory audits and compliance documentation</li>
                        <li>Improve services and fix bugs</li>
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All data usage is conducted in strict adherence to applicable regulatory standards and organizational policies.
                    </p>
                </section>

                {/* Section 6 - Security Measures */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-6">6. Data Security Measures</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                                <LockClosedIcon className="h-6 w-6 text-yellow-500 mr-2" />
                                Technical Safeguards:
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li><strong>Encryption:</strong> AES-256 for data at rest and TLS 1.3 for data in transit.</li>
                                <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access management.</li>
                                <li><strong>Secure Storage:</strong> Data hosted on ISO 27001-compliant cloud infrastructure.</li>
                                <li><strong>Regular Audits:</strong> Annual penetration testing and comprehensive security assessments.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                                <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                                Organizational Measures:
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li><strong>Data Classification:</strong> Sensitive medical data is flagged for enhanced protection.</li>
                                <li><strong>Access Logging:</strong> All data access events are recorded and actively monitored.</li>
                                <li><strong>Employee Training:</strong> Mandatory annual data protection and security training for all employees.</li>
                                <li><strong>Incident Response:</strong> 24/7 monitoring with a defined breach response protocol in place.</li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-6 text-sm italic text-center text-gray-600">
                        All technical and organizational measures are implemented to ensure the confidentiality, integrity, and availability of data in accordance with applicable regulatory and organizational standards.
                    </p>
                </section>

                {/* Section 7 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">7. Storage Locations</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>Primary:</strong> Servers located in India, in compliance with data localization requirements.</li>
                        <li><strong>Backup:</strong> Encrypted backups maintained with geographic redundancy to ensure data availability and disaster recovery.</li>
                    </ul>
                    <h3 className="text-xl font-semibold text-blue-800 mt-6 mb-3">Retention Periods:</h3>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>Personal Data:</strong> Retained for the duration of the service relationship plus two years.</li>
                        <li><strong>QA Records:</strong> Retained for a minimum of ten years in accordance with AERB requirements.</li>
                        <li><strong>Technical Logs:</strong> Retained for 90 days for security purposes and up to seven years for audit requirements.</li>
                        <li><strong>Deletion:</strong> Data is securely erased following NIST SP 800-88 standards when the retention period expires.</li>
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All storage and retention practices are designed to ensure compliance with regulatory requirements and organizational data protection policies.
                    </p>
                </section>

                {/* Section 8 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">8. Sharing & Disclosure</h2>
                    <p className="mb-4">
                        We do not sell personal or technical data. Limited sharing of data occurs only under the following circumstances:
                    </p>
                    <ul className="space-y-4">
                        <li>
                            <strong>Regulatory Bodies:</strong> Data may be shared with AERB, the Atomic Energy Commission, or other statutory authorities as required by law.
                        </li>
                        <li>
                            <strong>Service Providers:</strong> Data may be shared with authorized service providers under formal Data Processing Agreements (DPAs), including:
                            <ul className="list-circle pl-6 mt-2 space-y-1 text-gray-700">
                                <li><strong>Cloud Hosting:</strong> AWS or GCP servers located in India.</li>
                                <li><strong>Analytics:</strong> Only anonymized data is shared for analysis purposes.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Legal Compliance:</strong> Disclosure may be required to comply with court orders or governmental requests.
                        </li>
                    </ul>
                    <p className="mt-5 font-medium text-gray-700">
                        <strong>Vendor Requirements:</strong> All external processors are required to maintain equivalent security standards, adhere to applicable data protection regulations, and permit audits to ensure compliance.
                    </p>
                </section>

                {/* Section 9 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">9. Cross-Border Data Transfers</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>India-First Policy:</strong> All primary data processing activities are conducted within India to comply with data localization requirements.</li>
                        <li><strong>International Transfers:</strong> Cross-border data transfers occur only under Standard Contractual Clauses (SCCs) or where an adequacy decision has been provided by the relevant authority.</li>
                        <li><strong>Transfer Impact Assessments:</strong> A thorough assessment is conducted for all cross-border data flows to ensure compliance with applicable data protection laws and to mitigate risks.</li>
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All cross-border transfers are subject to strict organizational controls and regulatory compliance requirements.
                    </p>
                </section>

                {/* Section 10 - Your Rights */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-5">10. Your Rights (Under DPDP Act, 2023)</h2>
                    <p className="mb-4 ">As a Data Principal, you are entitled to the following rights regarding your personal data:</p>
                    <ol className="list-decimal list-inside space-y-3 mb-6">
                        <li><strong>Access:</strong> Obtain a free copy of your data twice per year.</li>
                        <li><strong>Correction:</strong> Request updates or corrections to any inaccurate or incomplete information.</li>
                        <li><strong>Erasure:</strong> Exercise the “Right to be Forgotten,” subject to applicable legal or regulatory retention requirements.</li>
                        <li><strong>Nomination:</strong> Appoint a nominee to manage your data on your behalf.</li>
                        <li><strong>Grievance Redressal:</strong> Escalate any concerns or complaints to the designated Grievance Officer.</li>
                    </ol>
                    <div className="bg-white/20 p-5 rounded-lg">
                        <h3 className="text-xl font-semibold mb-3">Process for Exercising Rights:</h3>
                        <ul className="space-y-2">
                            <li>• Submit requests via email to <a href="mailto:antesobiomedical.2014@gmail.com" className="underline font-medium">antesobiomedical.2014@gmail.com</a>.</li>
                            <li>• <strong>Timeline:</strong> Initial acknowledgment within 7 days; resolution within 30 days.</li>
                            <li>• <strong>Verification:</strong> KYC or other identity documents may be required to verify the requestor’s identity.</li>
                            <li>• <strong>Appeals:</strong> If a request is denied, you may escalate to the Grievance Officer for further review.</li>
                        </ul>
                    </div>
                    <p className="mt-5 italic ">
                        All requests will be handled in accordance with applicable regulatory requirements and organizational policies to ensure your rights are fully respected.
                    </p>
                </section>

                {/* Section 11 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">11. Data Breach Response</h2>
                    <p className="mb-4">To ensure timely and effective management of data breaches, the following measures are implemented:</p>
                    <ul className="space-y-4">
                        <li><strong>Detection:</strong> Continuous real-time monitoring using SIEM (Security Information and Event Management) systems.</li>
                        <li><strong>Containment:</strong> Immediate isolation of affected systems to prevent further data compromise.</li>
                        <li><strong>Notification:</strong>
                            <ul className="list-circle pl-6 mt-2 space-y-1 text-gray-700">
                                <li><strong>Users:</strong> Notification within 72 hours if the breach poses a high risk to data principals.</li>
                                <li><strong>Regulators:</strong> Notification to AERB and MeitY within 6 hours, in accordance with DPDP draft rules.</li>
                            </ul>
                        </li>
                        <li><strong>Remediation:</strong> Conduct a full forensic investigation and implement system hardening measures to prevent recurrence.</li>
                        <li><strong>Transparency:</strong> Share a post-incident report with affected users detailing the nature of the breach and corrective actions taken.</li>
                    </ul>
                    <p className="mt-5 italic text-gray-600">
                        All breach response activities are executed in alignment with applicable regulatory requirements and organizational security policies.
                    </p>
                </section>

                {/* Section 12 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">12. Cookies & Tracking</h2>
                    <p className="mb-4">The application may collect information through cookies and similar tracking technologies as follows:</p>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>Essential:</strong> Necessary for core application functionality; consent is not required.</li>
                        <li><strong>Analytics:</strong> Usage patterns may be tracked in an anonymized form; users have the option to opt out.</li>
                        <li><strong>Advertising:</strong> No advertising or targeted tracking is currently implemented.</li>
                    </ul>
                    <p className="mt-5 font-medium text-gray-700">
                        <strong>Transparency:</strong> Detailed information regarding all tracking mechanisms is disclosed within the application settings to ensure user awareness and control.
                    </p>
                </section>

                {/* Section 13 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">13. Third-Party Services</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>External SDKs:</strong> No third-party software development kits (SDKs) collect personal data without explicit user consent.</li>
                        <li><strong>App Store Compliance:</strong> The application adheres to all relevant Google Play and Apple App Store policies regarding data privacy and user protection.</li>
                        <li><strong>External Links:</strong> Any links to external websites are not covered under this Data Collection and Handling Policy; users are advised to review the privacy policies of those external sites separately.</li>
                    </ul>
                </section>

                {/* Section 14 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">14. Children's Privacy</h2>
                    <p><strong>Professional Use Only:</strong> The application is restricted to users who are 18 years of age or older and possess the required professional qualifications.</p>
                    <p><strong>Parental Consent:</strong> Not applicable, as the application is intended solely for qualified professionals and does not target children.</p>
                </section>

                {/* Section 15 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">15. Data Protection Officer</h2>
                    <p><strong>DPO Contact:</strong> <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">antesobiomedical.2014@gmail.com</a></p>
                    <p><strong>Role:</strong> Responsible for overseeing regulatory compliance, managing data subject requests, and serving as the primary liaison with regulatory authorities.</p>
                </section>

                {/* Section 17 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">17. Complaint Procedure</h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li><strong>Initial Contact:</strong> Submit complaints or concerns directly to the designated Grievance Officer.</li>
                        <li><strong>Acknowledgment:</strong> A written response will be provided within 7 days of receiving the complaint.</li>
                        <li><strong>Resolution:</strong> The complaint will be investigated and resolved within 30 days.</li>
                        <li><strong>Escalation:</strong> If the resolution is unsatisfactory, the complaint may be escalated to the Data Protection Board of India for further review.</li>
                    </ol>
                    <p className="mt-5 italic text-gray-600">
                        All complaints will be handled in accordance with applicable regulatory requirements and organizational policies to ensure timely and fair resolution.
                    </p>
                </section>

                {/* Section 18 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">18. Governing Law & Jurisdiction</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>Governing Law:</strong> This Policy and all related data processing activities shall be governed by the laws of India.</li>
                        <li><strong>Jurisdiction:</strong> Any disputes arising under or in connection with this Policy shall be subject to the exclusive jurisdiction of the courts in New Delhi.</li>
                        <li><strong>Applicable Regulations:</strong> Compliance will be maintained with the Digital Personal Data Protection (DPDP) Act, 2023, IT Rules, 2021, and relevant AERB Guidelines.</li>
                    </ul>
                </section>

                {/* Section 19 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-5">19. Changes to Policy</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li><strong>Material Changes:</strong> Users will be notified at least 30 days in advance of any material changes to this Policy via the application or email.</li>
                        <li><strong>Minor Updates:</strong> Non-material updates will be posted with an updated “Last Updated” date.</li>
                        <li><strong>Continued Use:</strong> Continued use of the application following any updates constitutes acceptance of the revised Policy.</li>
                    </ul>
                </section>

                {/* Section 20 - Contact */}
                <section className="mb-12 bg-blue-50 p-6 rounded-xl border-t-4 border-blue-600 text-center">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4">20. Contact Information</h2>
                    <div className="space-y-3 text-gray-700">
                        <p className="font-semibold text-lg">Anteso Biomedical (OPC) Private Limited</p>
                        <p className="text-sm">
                            Flat No. 290, 2nd Floor, D Block, Pocket 7, Sector 6,<br />
                            Rohini, New Delhi – 110 085
                        </p>
                        <p className="mt-4">
                            <strong>General:</strong>{' '}
                            <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">
                                antesobiomedical.2014@gmail.com
                            </a>{' '}
                            | +91 84709 09720
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-xs text-gray-500 mt-16">
                    © 2025 Anteso Biomedical (OPC) Private Limited. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default Privacy;