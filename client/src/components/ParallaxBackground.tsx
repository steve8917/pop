import React from 'react';
import './ParallaxBackground.css';

interface ParallaxBackgroundProps {
  image: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ image, children, variant = 'light' }) => {
  return (
    <div className="parallax-bg" style={{ backgroundImage: `url(${image})` }}>
      <div className={`parallax-bg-overlay parallax-bg-overlay--${variant}`}>
        {children}
      </div>
    </div>
  );
};

export default ParallaxBackground;
