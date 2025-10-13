import { useEffect, useRef, useState, useCallback } from 'react';
import { DocumentProcessingSSE, type SSEDocumentProcessingEvent, type SSEConnectionEvent, type SSEHeartbeatEvent } from '@/lib/sse';
import { toast } from 'sonner';
import type { DocumentProcessingStatus } from '@/types/sse';
import { SSEContext, type SSEContextType } from './Context';

interface SSEProviderProps {
    children: React.ReactNode;
    baseUrl?: string;
  }
  
export const SSEProvider = ({ children, baseUrl = 'http://localhost:3000' }: SSEProviderProps) => {
const [isConnected, setIsConnected] = useState(false);
const [connectionError, setConnectionError] = useState<string | null>(null);
const [processingStatus, setProcessingStatus] = useState<Map<string, DocumentProcessingStatus>>(new Map());
const [reconnectInfo, setReconnectInfo] = useState<{ attempts: number; maxAttempts: number }>({ attempts: 0, maxAttempts: 5 });

const sseRef = useRef<DocumentProcessingSSE | null>(null);
const onDocumentProcessingRef = useRef<((data: SSEDocumentProcessingEvent) => void) | null>(null);
const onTableRefreshRef = useRef<(() => void) | null>(null);

const getStatusMessage = useCallback((status: string, filename: string, error?: string) => {
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

const handleDocumentProcessing = useCallback((data: SSEDocumentProcessingEvent) => {
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

const handleConnectionOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
}, []);

const handleConnected = useCallback((data: SSEConnectionEvent) => {
    console.log('SSE Connected:', data);
}, []);

const handleHeartbeat = useCallback((data: SSEHeartbeatEvent) => {
    // Silent heartbeat - just keep connection alive
    console.debug('SSE Heartbeat:', data.timestamp);
}, []);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleConnectionError = useCallback((_event: Event) => {
    setIsConnected(false);
    setConnectionError('Connection lost. Attempting to reconnect...');
    toast.warning('Real-time connection lost. Attempting to reconnect...');
}, []);

const handleMaxReconnectAttemptsReached = useCallback(() => {
    setConnectionError('Failed to reconnect to real-time updates');
    toast.error('Failed to reconnect to real-time updates');
}, []);

const connect = useCallback(() => {
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

const disconnect = useCallback(() => {
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

const getDocumentStatus = useCallback((documentId: string) => {
    return processingStatus.get(documentId);
}, [processingStatus]);

const clearDocumentStatus = useCallback((documentId: string) => {
    setProcessingStatus(prev => {
    const newStatus = new Map(prev);
    newStatus.delete(documentId);
    return newStatus;
    });
}, []);

const clearAllStatuses = useCallback(() => {
    setProcessingStatus(new Map());
}, []);

const setOnDocumentProcessing = useCallback((handler: (data: SSEDocumentProcessingEvent) => void) => {
    onDocumentProcessingRef.current = handler;
}, []);

const setOnTableRefresh = useCallback((handler: () => void) => {
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
  