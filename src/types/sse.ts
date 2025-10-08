export interface DocumentProcessingStatus {
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
  lastUpdated: Date;
}
