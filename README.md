# FaceID Pro - Biometric Security System

A production-ready face detection and identification system built with React, Express, and Firebase.

## Features
- **Real-time Detection:** 30fps face tracking with bounding boxes.
- **Biometric Enrollment:** Register new users with unique 128-point face embeddings.
- **Identification:** High-speed matching using Euclidean distance.
- **Neural Engine:** Powered by `face-api.js` (TinyFaceDetector, FaceLandmarks, FaceRecognition).
- **Secure Cloud Storage:** Firestore for managed user profiles and vectors.

## Tech Stack
- **Frontend:** React 19, Tailwind CSS 4, Motion, Lucide Icons.
- **Backend:** Node.js, Express.
- **Database:** Firebase Firestore.
- **AI:** `face-api.js`.

## Setup Instructions
1. **Clone & Install:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   The app requires `GEMINI_API_KEY` (auto-injected in AI Studio) for advanced AI tasks (optional) and Firebase configuration.
3. **Run Development:**
   ```bash
   npm run dev
   ```
4. **Build & Start:**
   ```bash
   npm run build
   npm start
   ```

## Folder Structure
- `/src`: Frontend React application.
- `/src/lib`: Firebase and Face-API services.
- `/src/hooks`: Custom Firestore hooks.
- `/server.ts`: Express backend entry point.
- `/firestore.rules`: Hardened security rules.
- `/firebase-blueprint.json`: Database schema definition.

## Performance Optimization
- Models are loaded from CDN for zero-overhead deployment.
- Inference runs on-device (client-side) to ensure 0ms latency for private data.
- Embeddings are stored as arrays for fast Firestore querying.
