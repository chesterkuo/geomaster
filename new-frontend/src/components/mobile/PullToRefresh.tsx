import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh = ({ 
  onRefresh, 
  isRefreshing = false, 
  threshold = 80,
  className 
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');

  const startY = useRef(0);
  const currentY = useRef(0);
  const pullStarted = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pullStarted.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullStarted.current) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0 && window.scrollY === 0) {
        e.preventDefault();
        
        const distance = Math.min(deltaY * 0.5, threshold * 1.5);
        setPullDistance(distance);

        if (distance >= threshold && status !== 'ready') {
          setStatus('ready');
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        } else if (distance < threshold && status === 'ready') {
          setStatus('pulling');
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullStarted.current) {
        pullStarted.current = false;
        
        if (pullDistance >= threshold && !isRefreshing) {
          setIsTriggered(true);
          setStatus('refreshing');
          onRefresh();
        } else {
          setPullDistance(0);
          setStatus('idle');
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, isRefreshing, onRefresh, status]);

  useEffect(() => {
    if (!isRefreshing && isTriggered) {
      // Animate back to 0
      const timer = setTimeout(() => {
        setPullDistance(0);
        setIsTriggered(false);
        setStatus('idle');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, isTriggered]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;

  return (
    <div 
      className={cn(
        "absolute top-0 left-0 right-0 flex items-center justify-center",
        "transition-all duration-300 ease-out pointer-events-none z-30",
        className
      )}
      style={{
        transform: `translateY(${shouldShow ? Math.min(pullDistance - 40, 40) : -80}px)`,
        opacity: shouldShow ? Math.min(progress * 2, 1) : 0
      }}
    >
      <div className={cn(
        "bg-card border border-border rounded-full p-3 shadow-lg",
        "flex items-center justify-center",
        "transition-all duration-300"
      )}>
        <RefreshCw 
          className={cn(
            "h-5 w-5 text-foreground transition-all duration-300",
            isRefreshing || status === 'refreshing' 
              ? "animate-spin" 
              : status === 'ready'
                ? "text-primary scale-110"
                : ""
          )}
          style={{
            transform: `rotate(${progress * 180}deg)`
          }}
        />
      </div>

      {/* Status text */}
      <div className="absolute top-full mt-2 text-center">
        <div className={cn(
          "text-xs text-muted-foreground font-medium px-3 py-1",
          "bg-card/80 backdrop-blur rounded-full border border-border"
        )}>
          {status === 'ready' && '釋放以重新整理'}
          {status === 'pulling' && '下拉重新整理'}
          {status === 'refreshing' && '正在重新整理...'}
        </div>
      </div>
    </div>
  );
};