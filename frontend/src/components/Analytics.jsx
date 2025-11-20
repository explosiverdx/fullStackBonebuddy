import React from 'react';
import { Helmet } from 'react-helmet-async';

const Analytics = () => {
  return (
    <Helmet>
      {/* Google tag (gtag.js) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-MQNZP6M44N"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-MQNZP6M44N');
        `}
      </script>
    </Helmet>
  );
};

export default Analytics;