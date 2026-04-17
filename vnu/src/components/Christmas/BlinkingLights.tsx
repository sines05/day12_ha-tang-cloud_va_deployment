import React from 'react';
import './BlinkingLights.css';

interface Light {
  color: 'red' | 'blue' | 'yellow' | 'green';
  top: string;
  left: string;
  delay: string; // animation-delay
}

// These positions are percentages, so they can adapt to different screen sizes.
// They are estimates to place lights on the tree image.
const lights: Light[] = [
  // Red lights
  { color: 'red', top: '20%', left: '50%', delay: '0s' },
  { color: 'red', top: '55%', left: '25%', delay: '1.5s' },
  { color: 'red', top: '75%', left: '60%', delay: '0.5s' },
  
  // Blue lights
  { color: 'blue', top: '35%', left: '30%', delay: '0.2s' },
  { color: 'blue', top: '60%', left: '70%', delay: '1.2s' },
  { color: 'blue', top: '80%', left: '40%', delay: '0.8s' },
  
  // Yellow lights
  { color: 'yellow', top: '45%', left: '65%', delay: '0.4s' },
  { color: 'yellow', top: '70%', left: '35%', delay: '1.8s' },
  
  // Green lights
  { color: 'green', top: '30%', left: '55%', delay: '0.6s' },
  { color: 'green', top: '50%', left: '45%', delay: '1.0s' },
];

const BlinkingLights: React.FC = () => {
  return (
    <>
      {lights.map((light, index) => (
        <div
          key={index}
          className={`light ${light.color}`}
          style={{
            top: light.top,
            left: light.left,
            animationDelay: light.delay,
          }}
        />
      ))}
    </>
  );
};

export default BlinkingLights;
