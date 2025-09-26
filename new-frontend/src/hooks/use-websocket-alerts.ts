import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenManager } from '../lib/api/client';
import { toast } from 'sonner';

export interface AlertNotification {
  type: 'alert_triggered';
  data: {
    alertId: string;
    alertType: string;
    websiteName: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    triggerData: any;
  };
}

export interface MetricsUpdate {
  type: 'metrics_updated';
  data: {
    websiteId: string;
    metricType: string;
    currentValue: number;
    previousValue?: number;
    changePercentage?: number;
    timestamp: string;
  };
}

export interface SystemNotification {
  type: 'system_notification';
  data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
    persistent?: boolean;
  };
}

export type WebSocketEvent = AlertNotification | MetricsUpdate | SystemNotification;

export interface UseWebSocketAlertsOptions {
  autoConnect?: boolean;
  showToasts?: boolean;
  onAlert?: (alert: AlertNotification) => void;
  onMetricsUpdate?: (update: MetricsUpdate) => void;
  onSystemNotification?: (notification: SystemNotification) => void;
}

export function useWebSocketAlerts(options: UseWebSocketAlertsOptions = {}) {
  const {
    autoConnect = true,
    showToasts = true,
    onAlert,
    onMetricsUpdate,
    onSystemNotification
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertNotification[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.74.100.10:3000';

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = tokenManager.getAccessToken();
    if (!token) {
      setError('No authentication token available');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    socketRef.current = io(API_BASE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('🔌 WebSocket connection error:', err);
      setIsConnected(false);
      setConnectionStatus('error');
      setError(err.message || 'Connection error');
    });

    // Welcome message
    socketRef.current.on('connected', (data) => {
      console.log('🎉 WebSocket welcome:', data);
      if (showToasts) {
        toast.success('Real-time alerts connected');
      }
    });

    // Alert notifications
    socketRef.current.on('alert_notification', (notification: AlertNotification) => {
      console.log('🚨 Alert notification received:', notification);
      
      setRecentAlerts(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 alerts
      
      if (showToasts) {
        const { data } = notification;
        toast[data.severity](`${data.alertType.replace('_', ' ').toUpperCase()}`, {
          description: `${data.websiteName}: ${data.message}`,
          duration: data.severity === 'error' ? 10000 : 5000
        });
      }
      
      onAlert?.(notification);
    });

    // Metrics updates
    socketRef.current.on('metrics_update', (update: MetricsUpdate) => {
      console.log('📊 Metrics update received:', update);
      onMetricsUpdate?.(update);
    });

    // System notifications
    socketRef.current.on('system_notification', (notification: SystemNotification) => {
      console.log('🔔 System notification received:', notification);
      
      if (showToasts) {
        const { data } = notification;
        toast[data.type](data.title, {
          description: data.message,
          duration: data.persistent ? Infinity : 5000
        });
      }
      
      onSystemNotification?.(notification);
    });

    // Connection stats (for admin dashboards)
    socketRef.current.on('connection_stats', (stats) => {
      console.log('📈 Connection stats:', stats);
    });

    // Alert status updates
    socketRef.current.on('alert_status_update', (status) => {
      console.log('⚡ Alert status update:', status);
    });

    // Ping/pong for connection health
    socketRef.current.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const subscribeToWebsite = (websiteId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_to_website', websiteId);
      console.log('📡 Subscribed to website updates:', websiteId);
    }
  };

  const unsubscribeFromWebsite = (websiteId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_from_website', websiteId);
      console.log('📡 Unsubscribed from website updates:', websiteId);
    }
  };

  const getAlertStatus = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get_alert_status');
      console.log('📊 Requested alert status');
    }
  };

  const ping = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  };

  const clearRecentAlerts = () => {
    setRecentAlerts([]);
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(ping, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionStatus,
    error,
    recentAlerts,
    connect,
    disconnect,
    subscribeToWebsite,
    unsubscribeFromWebsite,
    getAlertStatus,
    ping,
    clearRecentAlerts
  };
}