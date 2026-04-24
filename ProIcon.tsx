import React from "react";

interface ProIconProps {
  src: string;
  label?: string;
  onClick?: () => void;
}

export const ProIcon: React.FC<ProIconProps> = ({ src, label, onClick }) => {
  return (
    <div className="pro-icon-container" onClick={onClick} title={label}>
      <img src={src} alt={label} className="pro-icon-img" />
    </div>
  );
};
