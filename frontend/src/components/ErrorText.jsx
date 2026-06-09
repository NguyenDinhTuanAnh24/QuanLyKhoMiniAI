import React from 'react';

const ErrorText = ({ message }) => {
  if (!message) return null;
  return (
    <span className="text-red-500 text-sm mt-1 block font-medium">
      {message}
    </span>
  );
};

export default ErrorText;
