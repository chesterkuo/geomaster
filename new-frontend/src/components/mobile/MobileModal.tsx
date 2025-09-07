import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import { useTouchGestures } from "@/hooks/useTouchGestures";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  swipeToClose?: boolean;
  fullScreen?: boolean;
}

export const MobileModal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  swipeToClose = true,
  fullScreen = true
}: MobileModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchHandlers = useTouchGestures({
    onSwipeDown: swipeToClose ? onClose : undefined,
    swipeThreshold: 100,
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-all duration-300",
          isOpen ? "animate-in slide-in-from-bottom-full" : "animate-out slide-out-to-bottom-full"
        )}
      >
        <div
          className={cn(
            "relative w-full bg-background border border-border shadow-2xl",
            "transition-all duration-300 overflow-hidden",
            fullScreen 
              ? "h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-t-2xl" 
              : "max-h-[80vh] rounded-t-2xl sm:rounded-2xl sm:max-w-lg",
            className
          )}
          style={{
            transform: `translateY(${dragOffset}px)`
          }}
          {...(swipeToClose ? touchHandlers : {})}
        >
          {/* Drag handle (mobile only) */}
          {swipeToClose && (
            <div className="sm:hidden flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

// Mobile-optimized form components
interface MobileFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const MobileFormField = ({
  label,
  error,
  required,
  children,
  className
}: MobileFormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const MobileInput = ({ className, error, ...props }: MobileInputProps) => {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-lg border border-border bg-background",
        "px-4 py-3 text-base text-foreground placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
        "transition-all duration-200",
        "touch-manipulation", // Better touch handling
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
};

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const MobileTextarea = ({ className, error, ...props }: MobileTextareaProps) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-lg border border-border bg-background",
        "px-4 py-3 text-base text-foreground placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
        "transition-all duration-200 resize-none",
        "touch-manipulation",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
};

// Mobile-optimized button with touch feedback
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const MobileButton = ({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className,
  children,
  disabled,
  ...props 
}: MobileButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-lg font-medium",
    "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    "active:scale-95 touch-manipulation select-none",
    isPressed && "scale-95"
  );

  const sizeClasses = {
    sm: "h-9 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary",
    outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary",
    ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-primary"
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        (disabled || isLoading) && "opacity-50 pointer-events-none",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};