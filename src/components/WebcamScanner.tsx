import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, UserCheck, ShieldAlert, Zap } from 'lucide-react';

interface WebcamScannerProps {
  onScan?: (descriptor: Float32Array) => void;
  onRecognize?: (name: string, distance: number) => void;
  matcher?: faceapi.FaceMatcher | null;
  mode: 'register' | 'recognize';
}

export default function WebcamScanner({ onScan, onRecognize, matcher, mode }: WebcamScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detectedFace, setDetectedFace] = useState<{ name: string; score: number } | null>(null);

  useEffect(() => {
    let interval: any;

    const runDetection = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;

        // Sync canvas size with video
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        
        if (displaySize.width === 0 || displaySize.height === 0) {
          return;
        }

        if (canvas.width !== displaySize.width) {
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
        }

        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            resizedDetections.forEach((detection) => {
              const { x, y, width, height } = detection.detection.box;
              
              if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return;
              
              // Draw custom bounding box
              const isMatch = mode === 'recognize' && matcher && matcher.findBestMatch(detection.descriptor).label !== 'unknown';
              const accentColor = isMatch ? '#06b6d4' : '#ef4444'; // cyan or red
              
              ctx.strokeStyle = `${accentColor}cc`;
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);
              
              // Heavy Corners
              ctx.fillStyle = accentColor;
              const s = 12;
              const t = 4;
              // Top Left
              ctx.fillRect(x - 1, y - 1, s, t);
              ctx.fillRect(x - 1, y - 1, t, s);
              // Top Right
              ctx.fillRect(x + width - s + 1, y - 1, s, t);
              ctx.fillRect(x + width - t + 1, y - 1, t, s);
              // Bottom Left
              ctx.fillRect(x - 1, y + height - t + 1, s, t);
              ctx.fillRect(x - 1, y + height - s + 1, t, s);
              // Bottom Right
              ctx.fillRect(x + width - s + 1, y + height - t + 1, s, t);
              ctx.fillRect(x + width - t + 1, y + height - s + 1, t, s);

              if (mode === 'recognize' && matcher) {
                const bestMatch = matcher.findBestMatch(detection.descriptor);
                const name = bestMatch.label;
                const distance = bestMatch.distance;
                
                setDetectedFace({ name, score: 1 - distance });

                // Draw label background
                ctx.fillStyle = accentColor;
                ctx.fillRect(x, y - 24, name.length * 10 + 60, 24);
                
                // Draw text
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px JetBrains Mono';
                ctx.fillText(`ID: ${name.toUpperCase()} [${(1 - distance).toFixed(3)}]`, x + 6, y - 8);
                
                if (onRecognize) onRecognize(name, distance);
              }
            });
            
            if (resizedDetections.length === 0) {
              setDetectedFace(null);
            }
          }
        } catch (error: any) {
          if (error.message && error.message.includes('Box.constructor')) {
            // Ignore intermittent NaN box issues from face-api.js during video resize/loading
            console.debug('Ignored faceapi invalid box error');
          } else {
            console.error(error);
          }
        }
      }
    };

    interval = setInterval(runDetection, 100);
    return () => clearInterval(interval);
  }, [matcher, mode, onRecognize, onScan]);

  const handleCapture = async () => {
    if (webcamRef.current && webcamRef.current.video && onScan) {
      const video = webcamRef.current.video;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("Camera not ready. Please try again in a moment.");
        return;
      }

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections && onScan) {
          onScan(detections.descriptor);
        } else {
          alert("No face detected. Please look clearly at the camera.");
        }
      } catch (error: any) {
        if (error.message && error.message.includes('Box.constructor')) {
          alert("Detection glitch. Please make sure you are in good lighting and try again.");
          console.debug('Ignored faceapi invalid box error on capture', error);
        } else {
          console.error(error);
          alert("An error occurred during capture: " + error.message);
        }
      }
    }
  };

  return (
    <div className="relative group w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
      <div className="aspect-video relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover"
          onUserMedia={() => setIsCameraReady(true)}
          onUserMediaError={(err) => console.error(err)}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          mirrored={false}
          forceScreenshotSourceSize={false}
          imageSmoothing={true}
          disablePictureInPicture={true}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {/* Overlay scanning effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-primary/40 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-10"
          />
        </div>

        {/* Status Indicators */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md ${isCameraReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isCameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isCameraReady ? 'LIVE' : 'CONNECTING'}
          </div>
        </div>
      </div>

      {mode === 'register' && (
        <div className="p-4 bg-[#0d0f14] border-t border-border flex justify-center">
          <button
            onClick={handleCapture}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-black rounded font-mono font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Camera size={16} />
            Capture Biometric Data
          </button>
        </div>
      )}

      {mode === 'recognize' && detectedFace && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl z-20"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${detectedFace.name !== 'unknown' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {detectedFace.name !== 'unknown' ? <UserCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div>
                <h4 className="font-display font-medium text-lg leading-tight">
                  {detectedFace.name !== 'unknown' ? detectedFace.name : 'Unknown Subject'}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Zap size={10} className="text-amber-400" />
                  Confidence: {(detectedFace.score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
