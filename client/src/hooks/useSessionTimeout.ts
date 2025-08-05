import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before expiry
const CHECK_INTERVAL = 10 * 1000; // Check every 10 seconds

export function useSessionTimeout() {
  const [, setLocation] = useLocation();
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, INACTIVITY_TIMEOUT);
  }, []);

  const handleSessionExpired = useCallback(async () => {
    try {
      // Clear user session
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear React Query cache
      queryClient.clear();
      
      // Redirect to login
      setLocation('/login');
      
      // Show timeout message
      console.log('Session expired due to inactivity');
    } catch (error) {
      console.error('Error during session timeout:', error);
      // Still redirect to login even if logout fails
      setLocation('/login');
    }
  }, [setLocation]);

  const checkSessionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (response.status === 401) {
        // Session already expired on server
        queryClient.clear();
        setLocation('/login');
        return;
      }
      
      // Check for client-side inactivity
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const timeUntilExpiry = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      
      if (timeUntilExpiry <= 0) {
        handleSessionExpired();
        return;
      }
      
      // Show warning if within warning period
      if (timeUntilExpiry <= WARNING_TIME && !showWarning) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(timeUntilExpiry / 1000));
      } else if (showWarning && timeUntilExpiry > WARNING_TIME) {
        setShowWarning(false);
      }
      
      if (showWarning) {
        setTimeLeft(Math.ceil(timeUntilExpiry / 1000));
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  }, [setLocation, handleSessionExpired, showWarning]);

  const handleActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  const extendSession = useCallback(() => {
    resetTimeout();
    setShowWarning(false);
  }, [resetTimeout]);

  const logoutNow = useCallback(() => {
    handleSessionExpired();
  }, [handleSessionExpired]);

  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timeout timer
    resetTimeout();

    // Start periodic session checks
    intervalRef.current = setInterval(checkSessionStatus, CHECK_INTERVAL);

    // Cleanup function
    return () => {
      // Remove activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleActivity, resetTimeout, checkSessionStatus]);

  return {
    showWarning,
    timeLeft,
    extendSession,
    logoutNow,
    resetTimeout,
  };
}