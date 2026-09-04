import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  return (
    <div
      className={`
        min-h-full
        transition-all
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}
      `}
    >
      {children}
    </div>
  );
}
