import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

export const loadModels = async () => {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ]);
    console.log('Face-api models loaded');
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
};

export const getFaceDescriptor = async (element: HTMLVideoElement | HTMLImageElement) => {
  const detections = await faceapi
    .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detections ? detections.descriptor : null;
};

export const createMatcher = (users: { name: string, embeddings: number[][] }[]) => {
  if (users.length === 0) return null;

  const labeledDescriptors = users.map(user => {
    const descriptors = user.embeddings.map(arr => new Float32Array(arr));
    return new faceapi.LabeledFaceDescriptors(user.name, descriptors);
  });

  return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is common threshold
};
