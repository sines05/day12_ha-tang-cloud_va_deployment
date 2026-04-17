import React from 'react';
import BlinkingLights from './BlinkingLights';
import christmasTree from '../../assets/images/chrismas_tree.png';

const ChristmasHeaderDecoration: React.FC = () => (
  <div className="absolute bottom-0 relative" style={{ left: '2rem' }}>
    <img src={christmasTree} alt="Christmas Tree" className="h-16 sm:h-20" />
    <BlinkingLights />
  </div>
);

export default ChristmasHeaderDecoration;