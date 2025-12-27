import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - BoneBuddy</title>
        <meta name="description" content="BoneBuddy Privacy Policy - Learn how we collect, use, and protect your personal information." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            
            <div className="text-sm text-gray-600 mb-8 space-y-2">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p><strong>Place:</strong> Lucknow</p>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-6">
              <p>
                BoneBuddy ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use the BoneBuddy mobile application and Website ("App" and "Website"). By using the App or Website, you consent to the data practices described in this policy.
              </p>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                
                <div className="space-y-3">
                  <p>
                    <strong>a. Personal Information:</strong> We collect personal information including your name, age, contact details, and medical history during registration or service requests.
                  </p>
                  
                  <p>
                    <strong>b. Usage Data:</strong> Data such as device information, session logs, and IP addresses.
                  </p>
                  
                  <p>
                    <strong>c. Payment Information:</strong> Payment details for processing, including transaction history.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                
                <p>We use your data for:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Providing and improving our services.</li>
                  <li>Connecting you with appropriate healthcare professionals.</li>
                  <li>Maintaining accurate session logs and progress tracking.</li>
                  <li>Sending updates, appointment reminders, and notifications.</li>
                  <li>Complying with legal obligations and ensuring data security.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Sharing of Information</h2>
                
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Healthcare providers (doctors and physiotherapists) for personalized care.</li>
                  <li>Legal authorities if required by law or to protect our rights.</li>
                  <li>Service providers who assist in operating our platform under strict confidentiality agreements.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
                
                <p>
                  We implement robust security measures to protect your personal information against unauthorized access, alteration, or disclosure. However, no system is entirely secure, and we cannot guarantee the absolute safety of your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
                
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Access your personal information.</li>
                  <li>Correct any inaccuracies in your information.</li>
                  <li>Request deletion of your personal information, subject to legal obligations.</li>
                  <li>Withdraw consent for data processing, subject to the limitations of providing our services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Cookies and Tracking Technologies</h2>
                
                <p>
                  BoneBuddy may use cookies and similar technologies to enhance your experience, analyze app performance, and gather usage data. You can control cookie preferences through your device settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to this Privacy Policy</h2>
                
                <p>
                  We reserve the right to update this policy at any time. Any changes will be effective immediately upon posting the revised policy on our app or website. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
                
                <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
                <ul className="list-none pl-0 space-y-2 mt-3">
                  <li>
                    <strong>Email:</strong> <a href="mailto:info@bonebuddy.org" className="text-teal-600 hover:text-teal-700 underline">info@bonebuddy.org</a>
                  </li>
                  {/* <li>
                    <strong>Address:</strong> Plot No.44, A-Block, Indra Nagar, Lucknow - 226010
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

export default PrivacyPolicy;

