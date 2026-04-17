import React from 'react';
import BlinkingLights from '../Christmas/BlinkingLights';
import peachBlossom from '../../assets/images/blossom.png';

const NewYearHeaderDecoration: React.FC = () => (
  <div className="absolute bottom-0 relative" style={{ left: '2rem' }}>
    <img src={peachBlossom} alt="Peach Blossom" className="h-16 sm:h-20" />
    <BlinkingLights />
  </div>
);

export default NewYearHeaderDecoration;
