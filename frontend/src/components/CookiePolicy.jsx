import React from 'react';
import { Helmet } from 'react-helmet-async';

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - BoneBuddy</title>
        <meta name="description" content="BoneBuddy Cookie Policy - Learn how we use cookies and tracking technologies." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            
            <div className="text-sm text-gray-600 mb-8 space-y-2">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-6">
              <p>
                This Cookie Policy explains how BoneBuddy ("we," "our," or "us") uses cookies and similar tracking technologies when you visit our website or use our mobile application (collectively, the "Service"). This policy should be read alongside our Privacy Policy.
              </p>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies?</h2>
                
                <p>
                  Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website or use an app. They are widely used to make websites and apps work more efficiently and to provide information to the owners of the site or app.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
                
                <p>BoneBuddy uses cookies and similar technologies for various purposes, including:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>To enable essential functionality of our Service</li>
                  <li>To remember your preferences and settings</li>
                  <li>To analyze how our Service is used and improve user experience</li>
                  <li>To provide personalized content and advertisements</li>
                  <li>To maintain security and prevent fraud</li>
                  <li>To track session information and user interactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Types of Cookies We Use</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                    <p>
                      These cookies are necessary for the Service to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of essential cookies as they are required for the Service to work.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                    <p>
                      These cookies help us understand how visitors interact with our Service by collecting and reporting information anonymously. They help us improve the way our Service works.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Functionality Cookies</h3>
                    <p>
                      These cookies allow the Service to remember choices you make (such as your username, language, or region) and provide enhanced, more personalized features.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Targeting/Advertising Cookies</h3>
                    <p>
                      These cookies may be set through our Service by our advertising partners. They may be used to build a profile of your interests and show you relevant content on other sites.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Third-Party Cookies</h2>
                
                <p>
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements, and so on. These third parties may set cookies on your device when you use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Managing Cookies</h2>
                
                <p>
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your browser or device settings. However, please note that if you choose to reject cookies, you may not be able to use all features of our Service.
                </p>
                
                <p className="mt-3">
                  Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>See what cookies you have and delete them individually</li>
                  <li>Block third-party cookies</li>
                  <li>Block cookies from particular sites</li>
                  <li>Block all cookies from being set</li>
                  <li>Delete all cookies when you close your browser</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Mobile Application</h2>
                
                <p>
                  When using our mobile application, we may use similar tracking technologies to cookies, such as device identifiers and analytics tools, to provide and improve our services. You can manage these through your device settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to This Cookie Policy</h2>
                
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Effective Date" at the top.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
                
                <p>If you have any questions about our use of cookies or this Cookie Policy, please contact us at:</p>
                <ul className="list-none pl-0 space-y-2 mt-3">
                  <li>
                    <strong>Email:</strong> <a href="mailto:info@bonebuddy.org" className="text-teal-600 hover:text-teal-700 underline">info@bonebuddy.org</a>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CookiePolicy;

