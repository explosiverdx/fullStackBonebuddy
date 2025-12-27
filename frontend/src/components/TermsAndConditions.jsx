import React from 'react';
import { Helmet } from 'react-helmet-async';

const TermsAndConditions = () => {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - BoneBuddy</title>
        <meta name="description" content="BoneBuddy Terms & Conditions - Read our terms of service and user agreement." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
            
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-6">
              <p className="text-lg">
                By using BoneBuddy, you agree to the following terms:
              </p>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">⚖️</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">1. Acceptance of Terms</h2>
                </div>
                <p>
                  By downloading, registering, or using BoneBuddy, you accept and agree to abide by these Terms & Conditions. If you do not agree, you must discontinue use of the app immediately.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🔒</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">2. Eligibility</h2>
                </div>
                <p>
                  You must be at least 18 years old to register for an account. Individuals under 18 may use the app under the supervision of a parent or legal guardian.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🚫</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">3. User Responsibilities</h2>
                </div>
                <ul className="list-none space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">⚖️</span>
                    <span><strong>Accurate Medical Information:</strong> Users must provide accurate and truthful medical information to ensure the best health outcomes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">🔒</span>
                    <span><strong>Confidentiality of Interactions:</strong> All interactions between doctors, physiotherapists, and patients are strictly confidential and protected.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">🚫</span>
                    <span><strong>Account Suspension for Misuse:</strong> BoneBuddy reserves the right to suspend or terminate accounts for providing false or misleading information, inappropriate behavior, or misuse of the app.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">💡</span>
                    <span><strong>Using the App Responsibly:</strong> Users must avoid actions that could harm other users, disrupt the platform, or violate laws and regulations.</span>
                  </li>
                </ul>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">💡</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">4. Service Limitations</h2>
                </div>
                <p>
                  BoneBuddy connects users to healthcare professionals but does not provide medical advice or emergency services. The app is not a substitute for direct consultation with licensed medical practitioners.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">💳</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">5. Payment Terms</h2>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All payments made through the BoneBuddy app are non-refundable, as outlined in our Cancellation and Refund Policy.</li>
                  <li>Users are responsible for any fees associated with their selected services.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🔏</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">6. Intellectual Property</h2>
                </div>
                <p>
                  The BoneBuddy name, logo, and all associated content are the intellectual property of Physiox Pvt Ltd. Users are prohibited from reproducing, distributing, or modifying any part of the app without prior written consent.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">⚖️</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">7. Limitation of Liability</h2>
                </div>
                <p>
                  BoneBuddy and Physiox Pvt Ltd shall not be held liable for any errors, omissions, or inaccuracies in the information provided by users or third-party professionals, or any indirect, incidental, or consequential damages arising from the use of the app.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🔄</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">8. Modifications to Terms</h2>
                </div>
                <p>
                  BoneBuddy reserves the right to modify these Terms & Conditions at any time. Changes will take effect immediately upon posting. Users are encouraged to review the terms periodically.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">⚖️</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">9. Governing Law</h2>
                </div>
                <p>
                  These Terms & Conditions are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in Lucknow.
                </p>
              </section>

              <section>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">📞</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0">10. Contact Us</h2>
                </div>
                <p>If you have any questions or concerns regarding these Terms & Conditions, please contact us at:</p>
                <ul className="list-none pl-0 space-y-2 mt-3">
                  <li>
                    <strong>Email:</strong> <a href="info@bonebuddy.org" className="text-teal-600 hover:text-teal-700 underline">info@bonebuddy.org</a>
                  </li>
                  {/* <li>
                    <strong>Address:</strong> 302 Gadurahav kotwali, Balrampur, Uttar Pradesh - 271201, India
                  </li> */}
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsAndConditions;

