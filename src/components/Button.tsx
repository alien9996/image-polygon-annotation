import React, { ReactNode } from "react";
import '../css/area_setting.css';

export type ButtonProps = {
  label?: string;
  style?: any
  onClick?: (e: any) => void
  children: ReactNode
  className?: string
}

const Button = ({ label, onClick, style, className, children }: ButtonProps) => {
  return (
    <button
      style={{
        // margin: 8,
        // padding: "10px 16px",
        // color: "white",
        // backgroundColor: "#9966ff",
        // border: "none",
        // borderRadius: ".4rem",
        ...style
      }}
      className={className}
      onClick={onClick}
    >
      {children || label}
    </button>
  );
};

export default Button;