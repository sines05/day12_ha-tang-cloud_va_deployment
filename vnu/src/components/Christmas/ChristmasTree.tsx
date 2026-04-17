import React from 'react';

const ChristmasTree: React.FC = () => {
  return (
    <img
      src="/chrismas_tree.png"
      alt="Christmas Tree"
      className="absolute top-0 right-0 w-24 h-auto pointer-events-none"
      style={{ zIndex: 1000 }}
    />
  );
};

export default ChristmasTree;
