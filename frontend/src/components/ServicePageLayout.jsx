import React from 'react';
import { Link } from 'react-router-dom';
import './ServicesContentPages/ServicesContentPages.css';

const ServicePageLayout = ({ service }) => {
  if (!service) return null;

  return (
    <main className="main-content">
      <div className="max-w-4xl">
        <div className="mb-8">
          <Link to="/services" className="text-teal-600 hover-text-teal-800 transition-colors">
            &larr; Back to All Services
          </Link>
        </div>
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img src={service.imgSrc} alt={service.title} className="w-full h-56 object-cover object-center" />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{service.title}</h1>
            <p className="text-base text-gray-600 mb-6">{service.overview}</p>

            {service.subheading && (
              <h2 className="wrist-h2">{service.subheading}</h2>
            )}


            {service.phases && (
              <div className="mb-6">
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {service.phases.map((phase, index) => <li key={index}>{phase}</li>)}
                </ul>
              </div>
            )}

            {service.subheading2 && (
              <h2 className="wrist-h2">{service.subheading2}</h2>
            )}

            {service.benefits && (
              <div>
                <div className="grid grid-cols-1 gap-4">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center bg-teal-50 p-3 rounded-lg">
                      <span className="text-teal-500 mr-3">✔</span>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Contact Button */}
            <div className="mt-8 text-center">
              <a
                href="https://wa.me/918881119890?text=Hello%20Bonebuddy,%20Can%20I%20get%20more%20information%20about%20your%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Contact us on WhatsApp
              </a>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
};

export default ServicePageLayout;
