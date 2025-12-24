import React from 'react';
import { Helmet } from 'react-helmet-async';

const Analytics = () => {
  return (
    <Helmet>
      {/* Google tag (gtag.js) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-SBV793GJ31"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
           gtag('config', 'G-SBV793GJ31');
        `}
      </script>
    </Helmet>
  );
};

export default Analytics;