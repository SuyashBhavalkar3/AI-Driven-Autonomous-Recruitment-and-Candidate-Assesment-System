'use client'; // Required for App Router – marks this as a Client Component

import dynamic from 'next/dynamic';
import React from 'react';
import searchani from '@/public/lottie/search for employee.json'

// Dynamically import lottie-react with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const Loader = ({ width = 200, height = 200, fullPage = false }) => {
  const containerStyle = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      };

  return (
    <div style={containerStyle}>
      <Lottie
        animationData={searchani} // Path from public folder
        loop={true}
        style={{ width, height }}
      />
    </div>
  );
};

export default Loader;