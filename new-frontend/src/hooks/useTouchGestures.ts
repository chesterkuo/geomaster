import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPullToRefresh?: () => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
  doubleTapThreshold?: number;
  preventScroll?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  lastTapTime: number;
  isLongPress: boolean;
  pullDistance: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    onPullToRefresh,
    swipeThreshold = 50,
    longPressThreshold = 500,
    doubleTapThreshold = 300,
    preventScroll = false
  } = options;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    lastTapTime: 0,
    isLongPress: false,
    pullDistance: 0
  });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchState.current = {
      ...touchState.current,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: now,
      isLongPress: false,
      pullDistance: 0
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        touchState.current.isLongPress = true;
        onLongPress();
        
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, longPressThreshold);
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [onLongPress, longPressThreshold, preventScroll]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;

    const deltaY = touch.clientY - touchState.current.startY;
    
    // Pull to refresh logic
    if (onPullToRefresh && deltaY > 0 && window.scrollY === 0) {
      touchState.current.pullDistance = Math.min(deltaY, 100);
      
      // Provide visual feedback through custom event
      window.dispatchEvent(new CustomEvent('pullToRefreshProgress', {
        detail: { distance: touchState.current.pullDistance }
      }));
    }

    // Clear long press timer on movement
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [onPullToRefresh, preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const { startX, startY, currentX, currentY, startTime, lastTapTime, isLongPress, pullDistance } = touchState.current;
    const now = Date.now();
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const duration = now - startTime;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Skip gesture detection if this was a long press
    if (isLongPress) {
      return;
    }

    // Pull to refresh
    if (onPullToRefresh && pullDistance > 50) {
      onPullToRefresh();
      window.dispatchEvent(new CustomEvent('pullToRefreshTriggered'));
    }

    // Double tap detection
    if (onDoubleTap && duration < 200) {
      if (now - lastTapTime < doubleTapThreshold) {
        onDoubleTap();
        
        // Add haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([30, 50, 30]);
        }
        
        touchState.current.lastTapTime = 0; // Reset to prevent triple tap
        return;
      } else {
        touchState.current.lastTapTime = now;
      }
    }

    // Swipe detection
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) > swipeThreshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset pull distance
    touchState.current.pullDistance = 0;
    window.dispatchEvent(new CustomEvent('pullToRefreshEnd'));
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, onPullToRefresh, swipeThreshold, doubleTapThreshold]);

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return touchHandlers;
};

// Hook for detecting device capabilities
export const useDeviceCapabilities = () => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasHaptics = 'vibrate' in navigator;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return {
    isTouchDevice,
    hasHaptics,
    isIOS,
    isAndroid,
    isPWA
  };
};

// Hook for responsive breakpoint detection
export const useBreakpoint = () => {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  return {
    isMobile,
    isTablet,
    isDesktop
  };
};