import { createContext, useContext } from "react";
import type { SSEDocumentProcessingEvent } from "@/lib/sse";
import type { DocumentProcessingStatus } from "@/types/sse";

export interface SSEContextType {
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

export const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const useSSE = (): SSEContextType => {
    const context = useContext<SSEContextType | undefined>(SSEContext);
    if (context === undefined) {
        throw new Error('useSSE must be used within an SSEProvider');
    }
    return context;
}