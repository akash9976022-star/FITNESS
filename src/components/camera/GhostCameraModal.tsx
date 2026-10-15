import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  FlipHorizontal,
  Check,
  Upload,
  Eye,
  EyeOff,
  Timer,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { isMobileDevice, hasMediaDeviceSupport } from '../../utils/deviceDetection';
import { capturePhotoWithNativeCamera, isNativePlatform } from '../../services/nativeMobileService';

interface GhostCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (blob: Blob, previewUrl: string) => void;
}

export const GhostCameraModal: React.FC<GhostCameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.6); // 0, 0.3, 0.6, 0.9
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownTimerSecs, setCountdownTimerSecs] = useState<number>(3); // 0 = off, 3s, 5s
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isMobile = isMobileDevice();

  // Clean up stream on modal close or unmount
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (!hasMediaDeviceSupport()) {
      setIsInitializing(false);
      setCameraError('Camera not detected on this browser/environment. Drop a photo or select an image file below.');
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      let msg = 'Could not access camera. Please allow camera permissions or upload a photo directly.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings or choose a file.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. You can upload or drag-and-drop a photo from your gallery.';
      }
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [stream]);

  // Clipboard paste listener for desktop convenience
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            setCapturedBlob(file);
            setCapturedPhotoUrl(previewUrl);
            stopCamera();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Flip camera between front and back
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Capture frame from video to canvas
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 960;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image so preview matches user's natural reflection
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedPhotoUrl(previewUrl);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Native Capacitor camera handler for Android
  const handleNativeCapture = async (source: 'camera' | 'photos' = 'camera') => {
    const res = await capturePhotoWithNativeCamera(source);
    if (res) {
      setCapturedBlob(res.blob);
      setCapturedPhotoUrl(res.dataUrl);
      stopCamera();
    }
  };

  // Start snapshot trigger with optional countdown timer
  const handleCaptureTrigger = () => {
    if (isNativePlatform()) {
      handleNativeCapture('camera');
      return;
    }

    if (countdownTimerSecs > 0) {
      setCountdown(countdownTimerSecs);
      let remaining = countdownTimerSecs;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(null);
          takeSnapshot();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    } else {
      takeSnapshot();
    }
  };

  // Drag & drop handlers for desktop fallback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedBlob(file);
      setCapturedPhotoUrl(previewUrl);
      stopCamera();
    }
  };

  // Handle fallback file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedBlob(file);
      setCapturedPhotoUrl(previewUrl);
      stopCamera();
    }
  };

  // Confirm photo and send to parent
  const handleConfirmPhoto = () => {
    if (capturedBlob && capturedPhotoUrl) {
      onPhotoCaptured(capturedBlob, capturedPhotoUrl);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Ghost Overlay Camera
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-semibold">
                  Alignment Guide
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Match previous check-in posture and framing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex-1 bg-black aspect-[3/4] max-h-[65vh] w-full flex items-center justify-center overflow-hidden transition-all ${
            isDragging ? 'ring-4 ring-brand-500 scale-[0.99]' : ''
          }`}
        >
          {/* Drag & Drop Visual HUD */}
          {isDragging && (
            <div className="absolute inset-0 z-40 bg-brand-950/85 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-brand-400 p-6 text-center animate-fadeIn">
              <Upload className="w-12 h-12 text-brand-400 animate-bounce mb-2" />
              <p className="text-white font-bold text-sm">Drop Progress Photo Here</p>
              <p className="text-xs text-brand-300">File will load into alignment review</p>
            </div>
          )}

          {/* Active Live Video */}
          {!capturedPhotoUrl && (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Ghost Silhouette Overlay */}
              {showGhost && !cameraError && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300 z-10"
                  style={{ opacity: ghostOpacity }}
                >
                  <svg
                    viewBox="0 0 400 533"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[65vh] stroke-brand-400 fill-none"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  >
                    {/* Center Plumb Line */}
                    <line x1="200" y1="15" x2="200" y2="518" stroke="#10b981" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />

                    {/* Eye Level Line */}
                    <line x1="150" y1="92" x2="250" y2="92" stroke="#10b981" strokeWidth="1" opacity="0.4" />

                    {/* Head & Chin Contour */}
                    <ellipse cx="200" cy="88" rx="40" ry="50" />
                    {/* Chin alignment dot */}
                    <circle cx="200" cy="138" r="3" fill="#10b981" />

                    {/* Neck */}
                    <path d="M 182 136 L 180 158 M 218 136 L 220 158" />

                    {/* Traps & Shoulders Width Guideline */}
                    <path d="M 180 158 C 160 162 130 173 85 188 L 70 226 M 220 158 C 240 162 270 173 315 188 L 330 226" />

                    {/* Chest / Torso Arch */}
                    <path d="M 115 226 Q 200 254 285 226" strokeWidth="1.5" />
                    <circle cx="200" cy="232" r="4" fill="#10b981" opacity="0.8" />

                    {/* Ribcage & Waist V-Taper */}
                    <path d="M 115 226 L 135 322 L 145 378 M 285 226 L 265 322 L 255 378" />

                    {/* Belt / Waist Line */}
                    <line x1="140" y1="346" x2="260" y2="346" strokeWidth="1.5" stroke="#34d399" />

                    {/* Arms down outline */}
                    <path d="M 70 226 L 60 340 L 68 425 M 330 226 L 340 340 L 332 425" opacity="0.7" />

                    {/* Hip / Quad upper guide */}
                    <path d="M 145 378 L 138 465 M 255 378 L 262 465" opacity="0.7" />
                  </svg>

                  {/* Positioning HUD Guides */}
                  <div className="absolute top-4 inset-x-0 flex justify-center">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-brand-500/30 text-[11px] font-mono text-brand-300 shadow-md">
                      Align chin & shoulders with green guide
                    </span>
                  </div>
                </div>
              )}

              {/* Countdown Overlay Animation */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-pulse">
                  <div className="w-24 h-24 rounded-full border-4 border-brand-400 flex items-center justify-center bg-brand-500/20 text-white font-extrabold text-5xl font-mono shadow-glow">
                    {countdown}
                  </div>
                  <p className="text-white text-xs font-semibold mt-3">Hold posture steady...</p>
                </div>
              )}

              {/* Loading Indicator */}
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-300 font-medium">Starting camera...</p>
                </div>
              )}

              {/* Camera Error Fallback UI */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 z-20">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Camera Mode Standby</h4>
                  <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-glow"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isMobile ? 'Open Device Camera / Photos' : 'Choose File or Drop Photo'}</span>
                    </button>
                  </div>
                  {!isMobile && (
                    <span className="text-[10px] text-slate-500 mt-1">
                      Tip: You can also drag an image file or paste (Ctrl+V) directly
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Captured Photo Preview */}
          {capturedPhotoUrl && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhotoUrl}
                alt="Captured Check-in Preview"
                className="w-full h-full object-contain"
              />

              {/* Overlay Ghost Guide on Captured Preview for Alignment Check */}
              {showGhost && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300 z-10"
                  style={{ opacity: ghostOpacity }}
                >
                  <svg
                    viewBox="0 0 400 560"
                    className="w-full h-full max-w-[360px] max-h-[500px] stroke-brand-400 fill-none"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  >
                    <line x1="200" y1="20" x2="200" y2="540" stroke="#10b981" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
                    <ellipse cx="200" cy="95" rx="42" ry="54" />
                    <circle cx="200" cy="148" r="3" fill="#10b981" />
                    <path d="M 180 170 C 160 174 130 185 85 200 L 70 240 M 220 170 C 240 174 270 185 315 200 L 330 240" />
                    <path d="M 115 240 Q 200 270 285 240" strokeWidth="1.5" />
                    <line x1="140" y1="365" x2="260" y2="365" strokeWidth="1.5" stroke="#34d399" />
                  </svg>
                </div>
              )}

              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg z-20">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Staged</span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden File Input for Mobile & Desktop Fallback */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture={isMobile ? (facingMode === 'user' ? 'user' : 'environment') : undefined}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
          {!capturedPhotoUrl ? (
            <>
              {/* Secondary Controls: Timer, Ghost Opacity, Flip Camera */}
              <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                {/* Timer selector */}
                <button
                  type="button"
                  onClick={() => {
                    const next = countdownTimerSecs === 0 ? 3 : countdownTimerSecs === 3 ? 5 : 0;
                    setCountdownTimerSecs(next);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                    countdownTimerSecs > 0
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-300 font-semibold'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Self-timer delay"
                >
                  <Timer className="w-4 h-4" />
                  <span>{countdownTimerSecs === 0 ? 'Off' : `${countdownTimerSecs}s Timer`}</span>
                </button>

                {/* Ghost Outline Toggle & Opacity */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowGhost(!showGhost)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                      showGhost
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-300 font-semibold'
                        : 'border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Toggle Ghost Outline"
                  >
                    {showGhost ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>Ghost</span>
                  </button>

                  {showGhost && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpacity = ghostOpacity === 0.3 ? 0.6 : ghostOpacity === 0.6 ? 0.9 : 0.3;
                        setGhostOpacity(nextOpacity);
                      }}
                      className="px-2 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:text-white font-mono"
                      title="Adjust Ghost Opacity"
                    >
                      {Math.round(ghostOpacity * 100)}%
                    </button>
                  )}
                </div>

                {/* Flip camera */}
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Flip Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Flip</span>
                </button>
              </div>

              {/* Main Shutter Row */}
              <div className="flex items-center justify-around pt-1">
                {/* Upload from file button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isNativePlatform()) {
                      handleNativeCapture('photos');
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex flex-col items-center gap-1 text-[10px]"
                  title="Upload from Device"
                >
                  <Upload className="w-5 h-5" />
                  <span>Gallery</span>
                </button>

                {/* Big Shutter Button */}
                <button
                  type="button"
                  onClick={handleCaptureTrigger}
                  disabled={isInitializing || !!cameraError || countdown !== null}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-brand-500/30 p-1 bg-transparent hover:border-brand-500 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed group shadow-glow"
                  title="Capture Frame"
                >
                  <div className="w-full h-full rounded-full bg-brand-500 group-hover:bg-brand-400 transition-colors flex items-center justify-center">
                    <Camera className="w-7 h-7 text-slate-950" />
                  </div>
                </button>

                {/* Helper info */}
                <div className="p-3 rounded-2xl bg-slate-800/40 text-slate-400 flex flex-col items-center gap-1 text-[10px]">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                  <span>Front View</span>
                </div>
              </div>
            </>
          ) : (
            /* Review & Confirm Actions */
            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-glow flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Use This Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
