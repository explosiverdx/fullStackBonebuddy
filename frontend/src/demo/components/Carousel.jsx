import React, { useState, useEffect } from 'react';
import carousel1 from '../assets/carousel-1.jpg';
import carousel2 from '../assets/carousel-2.jpg';
import carousel3 from '../assets/carousel-3.jpg';
import carousel4 from '../assets/carousel-4.jpg';
import carousel5 from '../assets/carousel-5.jpg';

const images = [
  carousel1,
  carousel2,
  carousel3,
  carousel4,
  carousel5,
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000); // Auto slide every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-2 sm:mt-4 mb-2 sm:mb-4 p-2 sm:p-4">
      <div className="overflow-hidden rounded-lg shadow-lg border-2 border-gray-300">
        <img
          src={images[currentIndex]}
          alt={`Banner ${currentIndex + 1}`}
          className="w-full h-auto max-h-24 xs:max-h-32 sm:max-h-40 md:max-h-56 lg:max-h-64 xl:max-h-80 object-contain"
        />
      </div>
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-gray-700 bg-opacity-50 text-white rounded-full p-1 sm:p-2 hover:bg-opacity-75"
        aria-label="Previous Slide"
      >
        &#10094;
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gray-700 bg-opacity-50 text-white rounded-full p-1 sm:p-2 hover:bg-opacity-75"
        aria-label="Next Slide"
      >
        &#10095;
      </button>
    </div>
  );
};

export default Carousel;
