import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const documentElement = document.documentElement;
        const scrollTop = documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight =
          Math.max(documentElement.scrollHeight, document.body.scrollHeight) -
          documentElement.clientHeight;
        const percentage =
          scrollHeight > 0
            ? Math.min(100, (scrollTop / scrollHeight) * 100)
            : 0;

        setProgress(percentage);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-100 h-0.5 bg-transparent">
      <div
        className="h-full origin-left bg-moss transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
