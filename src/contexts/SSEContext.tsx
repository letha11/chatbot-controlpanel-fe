import React, { createContext, useContext, useEffect, useRef } from 'react';
import { DocumentProcessingSSE, type SSEDocumentProcessingEvent, type SSEConnectionEvent, type SSEHeartbeatEvent } from '@/lib/sse';
import { toast } from 'sonner';
import type { DocumentProcessingStatus } from '@/types/sse';

interface SSEContextType {
  isConnected: boolean;
  connectionError: string | null;
  processingStatus: Map<string, DocumentProcessingStatus>;
  reconnectInfo: { attempts: number; maxAttempts: number };
  getDocumentStatus: (documentId: string) => DocumentProcessingStatus | undefined;
  clearDocumentStatus: (documentId: string) => void;
  clearAllStatuses: () => void;
  setOnTableRefresh: (callback: () => void) => void;
  setOnDocumentProcessing: (callback: (data: SSEDocumentProcessingEvent) => void) => void;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

interface SSEProviderProps {
  children: React.ReactNode;
  baseUrl?: string;
}

export const SSEProvider: React.FC<SSEProviderProps> = ({ children, baseUrl = 'http://localhost:3000' }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = React.useState<Map<string, DocumentProcessingStatus>>(new Map());
  const [reconnectInfo, setReconnectInfo] = React.useState<{ attempts: number; maxAttempts: number }>({ attempts: 0, maxAttempts: 5 });
  
  const sseRef = useRef<DocumentProcessingSSE | null>(null);
  const onDocumentProcessingRef = useRef<((data: SSEDocumentProcessingEvent) => void) | null>(null);
  const onTableRefreshRef = useRef<(() => void) | null>(null);

  const getStatusMessage = React.useCallback((status: string, filename: string, error?: string) => {
    const messages = {
      // 'parsing_started': `Document "${filename}" uploaded, starting to parse...`,
      'parsing': `Parsing document "${filename}"...`,
      // 'parsed': `Document "${filename}" parsed successfully, generating embeddings...`,
      // 'embedding': `Creating vector embeddings for "${filename}"...`,
      'embedded': `Document "${filename}" processing completed!`,
      'failed': `Processing failed for "${filename}": ${error || 'Unknown error'}`
    };
    
    return messages[status as keyof typeof messages] || `Processing "${filename}"...`;
  }, []);

  const handleDocumentProcessing = React.useCallback((data: SSEDocumentProcessingEvent) => {
    const statusMessage = getStatusMessage(data.status, data.filename, data.error);
    
    // Show toast notification
    if (data.status === 'embedded') {
      toast.success(statusMessage);
    } else if (data.status === 'failed') {
      toast.error(statusMessage);
    } else if (data.status === 'parsing') {
      toast.info(statusMessage);
    }

    // Update processing status
    setProcessingStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(data.documentId, {
        ...data,
        lastUpdated: new Date()
      });
      return newStatus;
    });

    // Call custom handler if provided
    if (onDocumentProcessingRef.current) {
      onDocumentProcessingRef.current(data);
    }

    // Refresh table if document processing is complete or failed
    if (data.status === 'embedded' || data.status === 'failed') {
      if (onTableRefreshRef.current) {
        onTableRefreshRef.current();
      }
    }
  }, [getStatusMessage]);

  const handleConnectionOpen = React.useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
  }, []);

  const handleConnected = React.useCallback((data: SSEConnectionEvent) => {
    console.log('SSE Connected:', data);
  }, []);

  const handleHeartbeat = React.useCallback((data: SSEHeartbeatEvent) => {
    // Silent heartbeat - just keep connection alive
    console.debug('SSE Heartbeat:', data.timestamp);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConnectionError = React.useCallback((_event: Event) => {
    setIsConnected(false);
    setConnectionError('Connection lost. Attempting to reconnect...');
    toast.warning('Real-time connection lost. Attempting to reconnect...');
  }, []);

  const handleMaxReconnectAttemptsReached = React.useCallback(() => {
    setConnectionError('Failed to reconnect to real-time updates');
    toast.error('Failed to reconnect to real-time updates');
  }, []);

  const connect = React.useCallback(() => {
    if (sseRef.current) {
      sseRef.current.disconnect();
    }

    const sse = new DocumentProcessingSSE(baseUrl);
    sseRef.current = sse;
    
    sse.onConnectionOpen = handleConnectionOpen;
    sse.onConnected = handleConnected;
    sse.onHeartbeat = handleHeartbeat;
    sse.onDocumentProcessing = handleDocumentProcessing;
    sse.onConnectionError = handleConnectionError;
    sse.onMaxReconnectAttemptsReached = handleMaxReconnectAttemptsReached;
    
    sse.connect();
  }, [baseUrl, handleConnectionOpen, handleConnected, handleHeartbeat, handleDocumentProcessing, handleConnectionError, handleMaxReconnectAttemptsReached]);

  const disconnect = React.useCallback(() => {
    if (sseRef.current) {
      sseRef.current.disconnect();
      sseRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Initialize SSE connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update reconnect info
  useEffect(() => {
    if (sseRef.current) {
      setReconnectInfo(sseRef.current.reconnectStatus);
    }
  }, [isConnected, connectionError]);

  const getDocumentStatus = React.useCallback((documentId: string) => {
    return processingStatus.get(documentId);
  }, [processingStatus]);

  const clearDocumentStatus = React.useCallback((documentId: string) => {
    setProcessingStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.delete(documentId);
      return newStatus;
    });
  }, []);

  const clearAllStatuses = React.useCallback(() => {
    setProcessingStatus(new Map());
  }, []);

  const setOnDocumentProcessing = React.useCallback((handler: (data: SSEDocumentProcessingEvent) => void) => {
    onDocumentProcessingRef.current = handler;
  }, []);

  const setOnTableRefresh = React.useCallback((handler: () => void) => {
    onTableRefreshRef.current = handler;
  }, []);

  const contextValue: SSEContextType = {
    isConnected,
    connectionError,
    processingStatus,
    reconnectInfo,
    getDocumentStatus,
    clearDocumentStatus,
    clearAllStatuses,
    setOnTableRefresh,
    setOnDocumentProcessing
  };

  return (
    <SSEContext.Provider value={contextValue}>
      {children}
    </SSEContext.Provider>
  );
};

export const useSSE = (): SSEContextType => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error('useSSE must be used within an SSEProvider');
  }
  return context;
};
