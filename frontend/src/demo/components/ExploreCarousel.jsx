'use client';
import React, { useRef } from 'react';
import { Carousel } from '@mantine/carousel';
import Autoplay from 'embla-carousel-autoplay';
import '@mantine/carousel/styles.css';
import './ExploreCarousel.css';

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

const ExploreCarousel = () => {
  const autoplay = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));

  return (
    <div className="relative">
      <Carousel
        className="mt-0"
        slideSize="100%"
        slideGap={0}
        loop
        withIndicators
        withControls
        align="start"
        classNames={{
          control: 'carousel-control',
          controls: 'carousel-controls',
          indicator: 'carousel-indicator',
          indicators: 'carousel-indicators',
        }}
        plugins={[autoplay.current]}
        onMouseEnter={autoplay.current.stop}
        onMouseLeave={autoplay.current.play}
      >
        {images.map((src, index) => (
          <Carousel.Slide key={index}>
            <img
              src={src}
              alt={`Slide ${index + 1}`}
              className="w-full h-auto sm:h-52 md:h-72 lg:h-80 xl:h-96 object-contain rounded-md"
            />
          </Carousel.Slide>
        ))}
      </Carousel>
    </div>
  );
};

export default ExploreCarousel;
