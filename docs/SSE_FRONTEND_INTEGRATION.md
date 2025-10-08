# SSE Frontend Integration Guide

## Overview

This document provides complete integration instructions for implementing Server-Sent Events (SSE) in the frontend to receive real-time notifications about document processing status from the Chatbot Control Panel backend.

## Architecture

```
Frontend Client          Express Backend          FastAPI Microservice
     |                        |                           |
     |-- SSE Connect -------->|                           |
     |<-- Connected Event ----|                           |
     |                        |                           |
     |-- Upload Document ---->|                           |
     |<-- Parsing Started ----|                           |
     |                        |-- Parse Request --------->|
     |                        |                           |-- Start Processing
     |                        |<-- Webhook Notification --|
     |<-- Parsing Complete ---|                           |
     |                        |<-- Webhook Notification --|
     |<-- Embedding Started --|                           |
     |                        |<-- Webhook Notification --|
     |<-- Processing Complete-|                           |
```

## API Endpoints

### SSE Connection Endpoint
- **URL**: `GET /api/v1/events`
- **Purpose**: Establish SSE connection for real-time notifications
- **Headers**: Standard SSE headers are automatically set
- **Response**: Event stream with various event types

### Document Upload Endpoint
- **URL**: `POST /api/v1/documents/upload`
- **Purpose**: Upload document and trigger processing
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: `file` (document), `division_id` (optional)
- **Response**: Document metadata with initial status

## Event Types

### 1. Connection Events

#### `connected`
Triggered when SSE connection is established.

```javascript
{
  "message": "Connected to document processing events",
  "clientId": "uuid-string",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### `heartbeat`
Periodic keep-alive message (every 30 seconds).

```javascript
{
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Document Processing Events

#### `document_processing`
Main event type for all document processing status updates.

```javascript
{
  "documentId": "uuid-string",
  "status": "parsing_started|parsing|parsed|embedding|embedded|failed",
  "message": "Human-readable message",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "filename": "document.pdf",
  "fileType": "pdf",
  "divisionId": "uuid-string",
  "chunkCount": 10,        // Only for parsed status
  "embeddingCount": 10,    // Only for embedded status
  "error": "Error message", // Only for failed status
  "stage": "parsing|embedding|processing" // Only for failed status
}
```

## Status Flow

### Successful Processing Flow
1. `parsing_started` - Document upload complete, parsing initiated
2. `parsing` - Document parsing in progress
3. `parsed` - Document parsing completed
4. `embedding` - Embedding generation in progress
5. `embedded` - Processing completed successfully

### Failed Processing Flow
1. `parsing_started` - Document upload complete, parsing initiated
2. `failed` - Processing failed (with error details)

## Frontend Implementation

### Basic SSE Connection

```javascript
class DocumentProcessingSSE {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    try {
      this.eventSource = new EventSource('/api/v1/events');
      
      this.eventSource.onopen = (event) => {
        console.log('SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionOpen(event);
      };

      this.eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('Connected to SSE:', data);
        this.onConnected(data);
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        const data = JSON.parse(event.data);
        this.onHeartbeat(data);
      });

      this.eventSource.addEventListener('document_processing', (event) => {
        const data = JSON.parse(event.data);
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

  handleReconnect() {
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
  onConnectionOpen(event) {}
  onConnected(data) {}
  onHeartbeat(data) {}
  onDocumentProcessing(data) {}
  onConnectionError(event) {}
  onMaxReconnectAttemptsReached() {}
}
```

### React Hook Implementation

```javascript
import { useState, useEffect, useCallback } from 'react';

export const useDocumentProcessingSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(new Map());
  const [connectionError, setConnectionError] = useState(null);

  const handleDocumentProcessing = useCallback((data) => {
    setProcessingStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(data.documentId, {
        ...data,
        lastUpdated: new Date()
      });
      return newStatus;
    });
  }, []);

  const handleConnectionOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
  }, []);

  const handleConnectionError = useCallback((event) => {
    setIsConnected(false);
    setConnectionError('Connection lost. Attempting to reconnect...');
  }, []);

  useEffect(() => {
    const sse = new DocumentProcessingSSE();
    
    sse.onConnectionOpen = handleConnectionOpen;
    sse.onDocumentProcessing = handleDocumentProcessing;
    sse.onConnectionError = handleConnectionError;
    
    sse.connect();

    return () => {
      sse.disconnect();
    };
  }, [handleConnectionOpen, handleDocumentProcessing, handleConnectionError]);

  const getDocumentStatus = useCallback((documentId) => {
    return processingStatus.get(documentId);
  }, [processingStatus]);

  const clearDocumentStatus = useCallback((documentId) => {
    setProcessingStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.delete(documentId);
      return newStatus;
    });
  }, []);

  return {
    isConnected,
    connectionError,
    processingStatus,
    getDocumentStatus,
    clearDocumentStatus
  };
};
```

### React Component Example

```javascript
import React, { useState } from 'react';
import { useDocumentProcessingSSE } from './hooks/useDocumentProcessingSSE';

const DocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { isConnected, getDocumentStatus, clearDocumentStatus } = useDocumentProcessingSSE();

  const handleFileUpload = async (file, divisionId) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    if (divisionId) {
      formData.append('division_id', divisionId);
    }

    try {
      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Document uploaded:', result.data);
        // Status updates will come via SSE
      } else {
        console.error('Upload failed:', result);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderDocumentStatus = (documentId) => {
    const status = getDocumentStatus(documentId);
    if (!status) return null;

    const getStatusColor = (status) => {
      switch (status.status) {
        case 'parsing_started':
        case 'parsing':
        case 'embedding':
          return 'blue';
        case 'parsed':
          return 'yellow';
        case 'embedded':
          return 'green';
        case 'failed':
          return 'red';
        default:
          return 'gray';
      }
    };

    const getStatusIcon = (status) => {
      switch (status.status) {
        case 'parsing_started':
        case 'parsing':
          return '📄';
        case 'parsed':
          return '✅';
        case 'embedding':
          return '🔍';
        case 'embedded':
          return '🎉';
        case 'failed':
          return '❌';
        default:
          return '⏳';
      }
    };

    return (
      <div className={`status-indicator ${getStatusColor(status.status)}`}>
        <span>{getStatusIcon(status.status)}</span>
        <span>{status.message}</span>
        {status.status === 'embedded' && (
          <button onClick={() => clearDocumentStatus(documentId)}>
            Clear
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="connection-status">
        SSE Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      {/* Your file upload form here */}
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
        disabled={uploading}
      />
      
      {uploading && <div>Uploading...</div>}
      
      {/* Render document statuses */}
      {Array.from(processingStatus.keys()).map(documentId => (
        <div key={documentId}>
          {renderDocumentStatus(documentId)}
        </div>
      ))}
    </div>
  );
};

export default DocumentUpload;
```

## Status Handling Strategies

### 1. Progress Indicators

```javascript
const getProgressPercentage = (status) => {
  switch (status.status) {
    case 'parsing_started':
      return 10;
    case 'parsing':
      return 30;
    case 'parsed':
      return 50;
    case 'embedding':
      return 80;
    case 'embedded':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
};
```

### 2. Status Messages

```javascript
const getStatusMessage = (status) => {
  const messages = {
    'parsing_started': 'Document uploaded, starting to parse...',
    'parsing': 'Parsing document content...',
    'parsed': 'Document parsed successfully, generating embeddings...',
    'embedding': 'Creating vector embeddings...',
    'embedded': 'Document processing completed!',
    'failed': `Processing failed: ${status.metadata?.error || 'Unknown error'}`
  };
  
  return messages[status.status] || 'Processing...';
};
```

### 3. Error Handling

```javascript
const handleProcessingError = (status) => {
  if (status.status === 'failed') {
    const error = status.metadata?.error || 'Unknown error';
    const stage = status.metadata?.stage || 'processing';
    
    // Show user-friendly error message
    showErrorNotification(`Document processing failed during ${stage}: ${error}`);
    
    // Optionally retry or provide recovery options
    showRetryOption(status.documentId);
  }
};
```

## Configuration

### Environment Variables

```env
# Backend URL (adjust for your environment)
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SSE_ENDPOINT=/api/v1/events
```

### API Configuration

```javascript
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  sseEndpoint: process.env.REACT_APP_SSE_ENDPOINT || '/api/v1/events',
  uploadEndpoint: '/api/v1/documents/upload',
  timeout: 30000, // 30 seconds
  retryAttempts: 5,
  retryDelay: 1000
};
```

## Testing

### Manual Testing

1. **Start the backend services**:
   ```bash
   # Express backend
   cd express-api && npm run dev
   
   # FastAPI microservice
   cd fastapi-ml && uvicorn app.main:app --reload
   ```

2. **Test SSE connection**:
   ```javascript
   // Open browser console and run:
   const eventSource = new EventSource('http://localhost:3000/api/v1/events');
   eventSource.addEventListener('document_processing', (e) => console.log(JSON.parse(e.data)));
   ```

3. **Upload a test document** and monitor the console for SSE events.

### Automated Testing

```javascript
// Jest test example
describe('DocumentProcessingSSE', () => {
  test('should connect to SSE endpoint', async () => {
    const sse = new DocumentProcessingSSE();
    const connectPromise = new Promise(resolve => {
      sse.onConnectionOpen = resolve;
    });
    
    sse.connect();
    await connectPromise;
    
    expect(sse.isConnected).toBe(true);
    sse.disconnect();
  });
});
```

## Troubleshooting

### Common Issues

1. **SSE Connection Fails**
   - Check if backend is running on correct port
   - Verify CORS configuration
   - Check browser console for errors

2. **Events Not Received**
   - Verify SSE connection is established
   - Check network tab for SSE requests
   - Ensure event listeners are properly attached

3. **Connection Drops**
   - Implement reconnection logic
   - Check for network issues
   - Verify backend is not restarting

### Debug Tools

```javascript
// Enable debug logging
const DEBUG_SSE = true;

const logSSEEvent = (event, data) => {
  if (DEBUG_SSE) {
    console.log(`[SSE] ${event}:`, data);
  }
};

// Use in event handlers
eventSource.addEventListener('document_processing', (event) => {
  const data = JSON.parse(event.data);
  logSSEEvent('document_processing', data);
  // ... handle event
});
```

## Security Considerations

1. **Authentication**: SSE endpoint should respect authentication
2. **CORS**: Proper CORS configuration for cross-origin requests
3. **Rate Limiting**: Consider implementing rate limiting for SSE connections
4. **Data Validation**: Validate all incoming SSE data

## Performance Considerations

1. **Connection Limits**: Browsers have limits on concurrent SSE connections
2. **Memory Management**: Clean up old document statuses
3. **Reconnection**: Implement exponential backoff for reconnections
4. **Event Filtering**: Consider filtering events by user or document type

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE**: Not supported (use polyfill or alternative)
- **Mobile**: Generally supported on modern mobile browsers

## Next Steps

1. Implement the SSE connection in your frontend
2. Add UI components for status display
3. Test with various document types and sizes
4. Add error handling and retry logic
5. Consider adding user preferences for notifications

This integration will provide real-time feedback to users during document processing, significantly improving the user experience of your Chatbot Control Panel application.
