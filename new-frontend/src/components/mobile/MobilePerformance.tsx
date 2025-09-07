import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenInView) {
          setHasBeenInView(true);
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [hasBeenInView, options]);

  return { ref, isInView, hasBeenInView };
};

// Lazy loading component
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export const LazyLoad = ({ 
  children, 
  fallback = <Skeleton className="w-full h-32" />, 
  className,
  rootMargin = "100px",
  threshold = 0.1
}: LazyLoadProps) => {
  const { ref, hasBeenInView } = useIntersectionObserver({
    rootMargin,
    threshold,
  });

  return (
    <div ref={ref} className={className}>
      {hasBeenInView ? children : fallback}
    </div>
  );
};

// Virtual scrolling for long lists
interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualScroll = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className
}: VirtualScrollProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.visibleItems.map((item, index) =>
            renderItem(item, visibleItems.startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};

// Image lazy loading with progressive enhancement
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  blurDataURL?: string;
}

export const LazyImage = ({
  src,
  alt,
  placeholder,
  className,
  blurDataURL,
  ...props
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder || blurDataURL);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { ref, hasBeenInView } = useIntersectionObserver();

  useEffect(() => {
    if (!imageRef || !hasBeenInView) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [imageRef, hasBeenInView, src]);

  const handleImageRef = (el: HTMLImageElement | null) => {
    setImageRef(el);
  };

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <img
        ref={handleImageRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          !isLoaded && "blur-sm scale-105",
          isLoaded && "blur-0 scale-100"
        )}
        {...props}
      />
      {!hasBeenInView && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {isError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">載入失敗</span>
        </div>
      )}
    </div>
  );
};

// Connection-aware loading
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.effectiveType || "unknown");
        setIsSlowConnection(connection.effectiveType === "slow-2g" || connection.effectiveType === "2g");
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType, isSlowConnection };
};

// Adaptive loading based on device capabilities
export const useAdaptiveLoading = () => {
  const { isSlowConnection } = useNetworkStatus();
  const [deviceMemory, setDeviceMemory] = useState<number>(4); // Default 4GB
  const [hardwareConcurrency, setHardwareConcurrency] = useState<number>(4);

  useEffect(() => {
    // Get device memory if available
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      setDeviceMemory(memory);
    }

    // Get CPU cores
    setHardwareConcurrency(navigator.hardwareConcurrency || 4);
  }, []);

  const shouldReduceQuality = isSlowConnection || deviceMemory < 2;
  const shouldLimitConcurrency = hardwareConcurrency < 4;
  const maxConcurrentRequests = Math.max(2, Math.floor(hardwareConcurrency / 2));

  return {
    shouldReduceQuality,
    shouldLimitConcurrency,
    maxConcurrentRequests,
    deviceCapabilities: {
      memory: deviceMemory,
      cores: hardwareConcurrency,
      isSlowConnection
    }
  };
};

// Progressive loading component
interface ProgressiveLoadProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  delay?: number;
  priority?: 'high' | 'normal' | 'low';
}

export const ProgressiveLoad = ({ 
  children, 
  fallback, 
  delay = 0, 
  priority = 'normal' 
}: ProgressiveLoadProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const { shouldReduceQuality } = useAdaptiveLoading();

  useEffect(() => {
    const priorityDelays = {
      high: 0,
      normal: shouldReduceQuality ? 200 : 50,
      low: shouldReduceQuality ? 500 : 100
    };

    const actualDelay = delay || priorityDelays[priority];

    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, actualDelay);

    return () => clearTimeout(timer);
  }, [delay, priority, shouldReduceQuality]);

  return shouldLoad ? <>{children}</> : <>{fallback}</>;
};

// Skeleton components for loading states
export const MobileSkeleton = {
  Card: ({ className }: { className?: string }) => (
    <div className={cn("p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  ),

  Chart: ({ className }: { className?: string }) => (
    <div className={cn("p-4 space-y-4", className)}>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-48 w-full" />
    </div>
  ),

  Table: ({ rows = 3, className }: { rows?: number; className?: string }) => (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 space-y-2 border border-border rounded-lg">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  ),

  Metrics: ({ className }: { className?: string }) => (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-3 space-y-2 border border-border rounded-lg">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
};