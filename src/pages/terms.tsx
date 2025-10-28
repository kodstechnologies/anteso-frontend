import React from 'react';
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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

        {/* Intro Paragraphs */}
        <div className="space-y-5 mb-10 text-lg">
          <p>
            Anteso Biomedical (OPC) Private Limited (“Company”, “we”, “our”, or “us”), a company incorporated under the Companies Act, 2013, with its registered office at Flat No. 290, 2nd Floor, D Block, Pocket 7, Sector 6, Rohini, New Delhi – 110 085, India, operates the ANTESO mobile application (the “App”).
          </p>
          <p>
            These Terms & Conditions (“Terms”) govern your access to and use of the App, including all services, features, and content provided through it (collectively, the “Services”). The App is specifically designed for Quality Assurance (QA) testing of radiology equipment in compliance with the guidelines issued by the Atomic Energy Regulatory Board (AERB).
          </p>
          <p className="font-medium text-gray-700">
            By downloading, installing, registering for, or using the App, you agree to be bound by these Terms, our Privacy Policy, and all applicable laws. If you do not agree to these Terms, you must not use the App.
          </p>
        </div>

        <hr className="my-12 border-gray-300" />

        {/* Section 1 - Eligibility */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">1</span> Eligibility
          </h2>
          <ul className="space-y-4 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Age Requirement:</strong> You must be at least 18 years old and legally competent to enter into binding agreements.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Professional Use:</strong> The App is intended exclusively for licensed medical professionals, radiologists, biomedical engineers, and authorized personnel from healthcare institutions that comply with AERB regulations.</span>
            </li>
            <li className="flex items-start">
              <XCircleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Prohibited Users:</strong> Government entities, competitors, or any unauthorized individuals are strictly prohibited from accessing or using the Services.</span>
            </li>
          </ul>
        </section>

        {/* Section 2 - User Registration */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">2</span> User Registration & Accounts
          </h2>
          <ul className="space-y-4 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Account Creation:</strong> You must create an account using accurate and complete information, including your name, email, contact details, and organization credentials.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Credentials:</strong> You are solely responsible for maintaining the confidentiality of your login credentials. Any unauthorized use or breach must be reported immediately to <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">antesobiomedical.2014@gmail.com</a>.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Account Termination:</strong> We reserve the right to suspend or terminate accounts at our sole discretion for violations of these Terms, misuse of the App, or non-compliance with AERB regulations.</span>
            </li>
          </ul>
        </section>

        {/* Section 3 - Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">3</span> Services Description
          </h2>
          <p className="mb-4">The App provides the following Services:</p>
          <ol className="space-y-4 ml-8 list-decimal">
            <li className="flex items-start">
              <span className="font-semibold mr-2">QA Testing Tools:</span>
              <span>Measurement of equipment parameters, analysis of image quality, and validation of radiation safety.</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">Report Generation:</span>
              <span>Generation of AERB-compliant QA certificates and test reports.</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">Data Management:</span>
              <span>Secure storage, management, and retrieval of test results and equipment logs.</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">Compliance Tracking:</span>
              <span>Tracking of regulatory audit trails and management of certifications.</span>
            </li>
          </ol>
          <p className="mt-5 italic text-gray-600">
            All Services are provided on an “as is” basis and may be subject to maintenance, updates, or modifications at our sole discretion.
          </p>
        </section>

        {/* Section 4 - User Obligations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">4</span> User Obligations & Responsibilities
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-3" />
                a. Compliance Requirements
              </h3>
              <ul className="space-y-3 ml-10">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You must possess valid AERB authorization, medical licenses, or institutional approvals to perform radiology QA testing.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>All equipment testing must strictly adhere to AERB Safety Code SC/MED-2 and other relevant guidelines.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You are solely responsible for ensuring the accuracy, integrity, and legality of any data uploaded to the App.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
                b. Prohibited Conduct
              </h3>
              <ul className="space-y-3 ml-10">
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Uploading falsified test results or data that does not comply with applicable regulations.</span>
                </li>
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Reverse engineering, decompiling, or attempting to extract the App’s source code.</span>
                </li>
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Using the App for purposes other than QA testing or for commercial resale.</span>
                </li>
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Interfering with the App’s functionality, security, or other users’ data.</span>
                </li>
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Sharing login credentials or allowing unauthorized access to your account.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <LockClosedIcon className="h-6 w-6 text-yellow-600 mr-3" />
                c. Equipment & Data Accuracy
              </h3>
              <ul className="space-y-3 ml-10">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You warrant that all equipment information and test parameters entered into the App are accurate and truthful.</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>The Company shall not be held liable for any errors or damages resulting from incorrect user input, equipment malfunction, or non-compliance with AERB guidelines.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5 - IP Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">5</span> Intellectual Property Rights
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">a. Company IP</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>The App, including its software, algorithms, QA templates, and all associated content, is the exclusive property of the Company.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>The Company grants you a limited, non-exclusive, non-transferable, and revocable license to use the App solely for authorized QA purposes.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>All trademarks, logos, and branding elements are protected under Indian trademark law and other applicable intellectual property laws.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">b. User Content</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You retain ownership of any data or content you upload to the App, including test results and equipment photos.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>By uploading content, you grant the Company a worldwide, royalty-free, non-exclusive license to process, store, and display such content for the purpose of delivering Services and ensuring regulatory compliance.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You represent and warrant that all content you upload does not infringe upon the rights of any third party and complies with applicable AERB standards and regulations.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">c. Generated Reports</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>AERB-compliant reports generated via the App are co-owned by you and the Company.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You may use these reports for regulatory and compliance purposes.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Commercial redistribution, resale, or third-party sharing of such reports requires prior written consent from the Company.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6 - Fees */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">6</span> Fees & Payment
          </h2>
          <ul className="space-y-3 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Current Pricing:</strong> Services may be offered on a subscription, per-test, or enterprise licensing basis. Specific pricing details will be provided during registration or on request.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Payment Terms:</strong> All fees are non-refundable, except as required by applicable law. Payments must be made using approved methods only.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className=" h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Taxes:</strong> You are responsible for all applicable taxes, including GST, service taxes, or other duties arising from your use of the Services.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Late Payments:</strong> Any overdue amounts will accrue interest at a rate of 1.5% per month or the maximum rate permitted by law, whichever is lower.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Price Changes:</strong> The Company reserves the right to adjust fees at its discretion. Any changes will be communicated 30 days in advance via email or in-App notification.</span>
            </li>
          </ul>
        </section>

        {/* Section 7 - Data */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">7</span> Data Ownership & Privacy
          </h2>
          <ul className="space-y-3 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Ownership:</strong> You retain ownership of all data you input into the App. The Company retains ownership of the App’s output formats, analytics, and any derived insights.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Privacy Policy:</strong> Your use of the App is also governed by the Company’s Privacy Policy, which is incorporated herein by reference and forms part of these Terms.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>AERB Compliance:</strong> All data handling, storage, and processing by the Company will comply with applicable AERB record-keeping and regulatory requirements.</span>
            </li>
          </ul>
        </section>

        {/* Section 8 - Warranties */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">8</span> Warranties & Disclaimers
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">a. Limited Warranty</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>We warrant that the App will perform substantially as described, subject to proper use and internet connectivity.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Services comply with AERB technical standards for QA testing.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3" />
                b. Disclaimers
              </h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>NO MEDICAL ADVICE:</strong> The App is a QA tool, not a diagnostic or treatment platform. We do not guarantee equipment safety or patient outcomes.</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>AS-IS BASIS:</strong> Services are provided "as is" without warranties of merchantability, fitness for purpose, or non-infringement.</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Third-Party Equipment:</strong> We are not responsible for hardware failures, calibration drift, or radiation exposure risks.</span>
                </li>
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Force Majeure:</strong> We are not liable for delays due to acts of God, regulatory changes, or third-party failures.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 9 - Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">9</span> Limitation of Liability
          </h2>
          <ul className="space-y-3 ml-8">
            <li className="flex items-start">
              <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Cap on Liability:</strong> The Company’s total liability to you for any claims arising out of or related to your use of the App shall not exceed the fees paid by you in the twelve (12) months preceding the claim.</span>
            </li>
            <li className="flex items-start">
              <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Exclusions:</strong> The Company shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including but not limited to data loss, business interruption, or regulatory fines.</span>
            </li>
            <li className="flex items-start">
              <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>AERB Compliance:</strong> You agree to indemnify and hold the Company harmless from any claims, losses, or damages arising from your failure to comply with AERB guidelines, improper use of equipment, or violations of applicable laws.</span>
            </li>
          </ul>
        </section>

        {/* Section 10 - Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">10</span> Termination
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">a. By User</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You may terminate your account at any time through the App settings or by contacting <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline">antesobiomedical.2014@gmail.com</a>.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Upon termination, your access to the App will end immediately. Retention and handling of your data will be governed by our Privacy Policy.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3">b. By Company</h3>
              <ul className="space-y-2 ml-8">
                <li className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>The Company may suspend or terminate your account and access to the App in the event of:</span>
                </li>
                <li className="ml-12">• Material breaches of these Terms.</li>
                <li className="ml-12">• Violations of AERB regulatory requirements.</li>
                <li className="ml-12">• Non-payment of fees.</li>
                <li className="ml-12">• Activities that pose security risks or involve illegal use of the App.</li>
                <li className="flex items-start mt-3">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Termination of your account does not relieve you of any payment obligations incurred prior to termination</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 11 - Indemnification */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">11</span> Indemnification
          </h2>
          <p className="ml-8 text-gray-700">
            You agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to:
          </p>
          <ul className="space-y-2 ml-12 mt-3">
            <li>• Your violation of these Terms or any applicable laws and regulations.</li>
            <li>• The submission of inaccurate, misleading, or unlawful data through the App.</li>
            <li>• Non-compliance with AERB guidelines or improper use of radiology equipment.</li>
            <li>• Any third-party claims arising from your use of reports or other content generated via the App.</li>
          </ul>
        </section>

        {/* Section 12 - Governing Law */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">12</span> Governing Law & Dispute Resolution
          </h2>
          <ul className="space-y-3 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Jurisdiction:</strong> The courts of New Delhi shall have exclusive jurisdiction over any disputes arising from or relating to these Terms.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Arbitration:</strong> Any disputes or claims arising out of or in connection with these Terms shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996, conducted in New Delhi before a single arbitrator appointed by the Company.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Class Actions:</strong> You agree that no class actions or representative proceedings shall be brought against the Company.</span>
            </li>
          </ul>
        </section>

        {/* Section 13 - Third-Party */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">13</span> Third-Party Services
          </h2>
          <ul className="space-y-2 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span>The App may integrate with third-party tools (e.g., cloud storage, payment gateways).</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span>Your use of such services is subject to their terms; we are not responsible for their performance or data handling.</span>
            </li>
          </ul>
        </section>

        {/* Section 14 - Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">14</span> Updates & Modifications
          </h2>
          <ul className="space-y-2 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span>We may update these Terms, the App, or Services at any time.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span>Material changes will be notified via email to <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline">antesobiomedical.2014@gmail.com</a> or in-App.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span>Continued use after updates constitutes acceptance.</span>
            </li>
          </ul>
        </section>

        {/* Section 15 - Miscellaneous */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-5 flex items-center">
            <span className="mr-3 text-blue-600 text-xl">15</span> Miscellaneous
          </h2>
          <ul className="space-y-2 ml-8">
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Entire Agreement:</strong> These Terms, Privacy Policy, and any service orders constitute the full agreement.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Severability:</strong> Invalid provisions do not affect remaining terms.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>No Waiver:</strong> Failure to enforce rights does not waive them.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Assignment:</strong> We may assign these Terms; you may not without our consent.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Force Majeure:</strong> Excused from performance due to unforeseen events beyond control.</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <span><strong>Contact:</strong> For questions, email <a href="mailto:antesobiomedical.2014@gmail.com" className="text-blue-600 underline font-medium">antesobiomedical.2014@gmail.com</a>.</span>
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