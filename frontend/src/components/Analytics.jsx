import React from 'react';
import { Helmet } from 'react-helmet-async';

const Analytics = () => {
  return (
    <Helmet>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-WT8X589LQ2"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-WT8X589LQ2');
        `}
      </script>
    </Helmet>
  );
};

export default Analytics;