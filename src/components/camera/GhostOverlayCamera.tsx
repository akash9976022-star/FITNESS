import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Sliders,
  Check,
  X,
  FlipHorizontal,
  Upload,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface GhostOverlayCameraProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  previousPhotoUrl?: string;
}

export const GhostOverlayCamera: React.FC<GhostOverlayCameraProps> = ({
  onCapture,
  onCancel,
  previousPhotoUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Overlay Controls
  const [overlayType, setOverlayType] = useState<'silhouette' | 'previous'>(
    previousPhotoUrl ? 'previous' : 'silhouette'
  );
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.35);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  // Initialize Camera Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported on this device/browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => {
            console.warn('Video play error:', err);
          });
        }
      } catch (err: unknown) {
        console.warn('Camera access denied or unavailable:', err);
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera access denied. You can still upload a photo.';
        setCameraError(msg);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Snap photo
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera to maintain natural mirror
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedPreview(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // File fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapturedBlob(file);
      setCapturedPreview(URL.createObjectURL(file));
    }
  };

  // Flip Camera
  const toggleFacingMode = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white bg-slate-950/80 z-20">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Ghost Overlay Alignment Camera</h3>
              <p className="text-[11px] text-slate-400">
                Match posture and framing for consistent historical tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[460px]">
          {/* Hidden File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Captured Preview Mode */}
          {capturedPreview ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedPreview}
                alt="Captured checkin"
                className="max-h-[60vh] w-full object-contain"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 z-30">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 backdrop-blur shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Denied / Error Fallback */
            <div className="p-6 text-center space-y-4 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Live Camera Unavailable</h4>
                <p className="text-xs text-slate-400">{cameraError}</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo from Library</span>
              </button>
            </div>
          ) : (
            /* Live Camera Stream with Ghost Overlay */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Ghost Silhouette Overlay */}
              {showOverlay && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity"
                  style={{ opacity: overlayOpacity }}
                >
                  {overlayType === 'previous' && previousPhotoUrl ? (
                    <img
                      src={previousPhotoUrl}
                      alt="Previous checkin ghost"
                      className="w-full h-full object-cover filter contrast-125"
                    />
                  ) : (
                    /* Anatomical Silhouette Contour SVG */
                    <svg
                      viewBox="0 0 400 700"
                      className="w-full h-full max-h-[90%] stroke-emerald-400 fill-transparent"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    >
                      {/* Vertical Alignment Center Axis */}
                      <line
                        x1="200"
                        y1="20"
                        x2="200"
                        y2="680"
                        stroke="rgba(52, 211, 153, 0.4)"
                        strokeWidth="1"
                        strokeDasharray="2 4"
                      />
                      {/* Horizontal Eye/Shoulder Guideline */}
                      <line
                        x1="40"
                        y1="190"
                        x2="360"
                        y2="190"
                        stroke="rgba(52, 211, 153, 0.4)"
                        strokeWidth="1"
                        strokeDasharray="2 4"
                      />
                      {/* Head contour */}
                      <ellipse cx="200" cy="110" rx="45" ry="60" />
                      {/* Neck */}
                      <path d="M 185 170 L 185 195 M 215 170 L 215 195" />
                      {/* Shoulders & Clavicle */}
                      <path d="M 185 195 C 150 200, 100 215, 80 235" />
                      <path d="M 215 195 C 250 200, 300 215, 320 235" />
                      {/* Torso & Ribcage */}
                      <path d="M 120 230 C 130 300, 140 370, 155 420" />
                      <path d="M 280 230 C 270 300, 260 370, 245 420" />
                      {/* Waist & Hips */}
                      <path d="M 155 420 C 145 470, 135 520, 130 620" />
                      <path d="M 245 420 C 255 470, 265 520, 270 620" />
                      {/* Arms outline */}
                      <path d="M 80 235 C 75 300, 70 380, 65 470" />
                      <path d="M 320 235 C 325 300, 330 380, 335 470" />
                    </svg>
                  )}
                </div>
              )}

              {/* Floating Camera Actions */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30">
                <button
                  type="button"
                  onClick={() => setShowOverlay((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur transition ${
                    showOverlay
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900/70 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ghost {showOverlay ? 'ON' : 'OFF'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur border border-slate-700 transition"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur border border-slate-700 transition"
                    title="Upload file instead"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ghost Overlay Controls (Bottom Floating Sheet) */}
              <div className="absolute bottom-20 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800/80 text-xs text-white space-y-2 z-20">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    Ghost Opacity: {Math.round(overlayOpacity * 100)}%
                  </span>
                  {previousPhotoUrl && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setOverlayType('previous')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          overlayType === 'previous'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Previous Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverlayType('silhouette')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          overlayType === 'silhouette'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Silhouette
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Shutter Button */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-30">
                <button
                  type="button"
                  onClick={handleSnap}
                  className="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-xl transition flex items-center justify-center cursor-pointer"
                  title="Take photo"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              </div>
            </>
          )}

          {/* Hidden Canvas for Frame Capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default GhostOverlayCamera;

