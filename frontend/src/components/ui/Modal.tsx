import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
}

export function Modal({ isOpen, onClose, children, className = "", variant = "light" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Entrance animation
      gsap.to(backdropRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseStyles = "relative z-10 w-full max-w-lg overflow-hidden";
  const themeStyles = variant === "dark" 
    ? "bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl" 
    : "bg-white border border-[#202020] rounded-[13px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)]";

  const closeButtonStyles = variant === "dark"
    ? "text-white/50 hover:text-white"
    : "text-black/40 hover:text-black";

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0"
        onClick={onClose}
      />

      {/* Content */}
      <div 
        ref={contentRef}
        className={`${baseStyles} ${themeStyles} ${className}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors p-1 ${closeButtonStyles}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
