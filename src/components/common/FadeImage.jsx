import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function FadeImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`
        relative
        overflow-hidden
        bg-hairline/20
        ${wrapperClassName}
      `}
    >
      {!loaded && !failed && (
        <div className="absolute inset-0 overflow-hidden bg-hairline/20">
          <div className="absolute inset-y-0 left-0 w-1/2 -translate-x-full animate-[botaniq-shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      )}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-stone/50">
          <ImageOff size={22} strokeWidth={1.4} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
          className={`
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            ease-out
            ${loaded ? "scale-100 opacity-100" : "scale-[1.025] opacity-0"}
            ${className}
          `}
          {...props}
        />
      )}
    </div>
  );
}
