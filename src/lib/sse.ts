// SSE Service for handling real-time document processing events
export interface SSEConnectionEvent {
  message: string;
  clientId: string;
  timestamp: string;
}

export interface SSEHeartbeatEvent {
  timestamp: string;
}

export interface SSEDocumentProcessingEvent {
  documentId: string;
  status: 'parsing_started' | 'parsing' | 'parsed' | 'embedding' | 'embedded' | 'failed';
  message: string;
  timestamp: string;
  filename: string;
  fileType: string;
  divisionId?: string;
  chunkCount?: number;
  embeddingCount?: number;
  error?: string;
  stage?: 'parsing' | 'embedding' | 'processing';
}

export type SSEEventType = 'connected' | 'heartbeat' | 'document_processing';

export class DocumentProcessingSSE {
  private eventSource: EventSource | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  connect() {
    try {
      const url = `${this.baseUrl}/api/v1/events`;
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = (event) => {
        console.log('SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionOpen(event);
      };

      this.eventSource.addEventListener('connected', (event) => {
        const data: SSEConnectionEvent = JSON.parse(event.data);
        console.log('Connected to SSE:', data);
        this.onConnected(data);
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        const data: SSEHeartbeatEvent = JSON.parse(event.data);
        this.onHeartbeat(data);
      });

      this.eventSource.addEventListener('document_processing', (event) => {
        const data: SSEDocumentProcessingEvent = JSON.parse(event.data);
        this.onDocumentProcessing(data);
      });

      this.eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        this.isConnected = false;
        this.onConnectionError(event);
        this.handleReconnect();
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.onMaxReconnectAttemptsReached();
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  // Event handlers (override in your implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConnectionOpen(_event: Event): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConnected(_data: SSEConnectionEvent): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHeartbeat(_data: SSEHeartbeatEvent): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDocumentProcessing(_data: SSEDocumentProcessingEvent): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConnectionError(_event: Event): void {}
  onMaxReconnectAttemptsReached(): void {}

  // Getters
  get connectionStatus(): boolean {
    return this.isConnected;
  }

  get reconnectStatus(): { attempts: number; maxAttempts: number } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    };
  }
}
