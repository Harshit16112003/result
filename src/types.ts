export interface UserFaceData {
  id: string;
  name: string;
  embeddings: number[][];
  createdAt: any; // Firestore Timestamp
}

export interface RecognitionResult {
  name: string;
  confidence: number;
  label: string;
}
