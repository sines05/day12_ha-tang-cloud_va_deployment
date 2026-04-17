import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';

interface StarRatingInputProps {
  rating: number;
  setRating: (rating: number) => void;
  totalStars?: number;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({ rating, setRating, totalStars = 5 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(totalStars)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={index}
            className="cursor-pointer bg-transparent border-none p-0"
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${ratingValue} out of ${totalStars} stars`}
          >
            <StarIcon filled={ratingValue <= (hover || rating)} />
          </button>
        );
      })}
    </div>
  );
};
