import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, X, AlertTriangle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Language, CameraErrorType } from '../types';
import { getT } from '../i18n';

interface CameraViewProps {
  language: Language;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  onSelectSample?: (sampleDataUrl: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  language,
  onCapture,
  onClose,
  onSelectSample,
}) => {
  const t = getT(language);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<CameraErrorType | null>(null);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);

  // Initialize or reconfigure camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setPermissionState('loading');
    setErrorType(null);
    setErrorMessage('');

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('denied');
      setErrorType('NOT_SUPPORTED');
      setErrorMessage('Your browser does not support in-browser camera streaming. Please use the camera upload button.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play warning:', err);
        });
      }

      // Check if torch/flashlight is supported
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if ('torch' in capabilities) {
          setTorchAvailable(true);
        } else {
          setTorchAvailable(false);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setPermissionState('denied');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('PERMISSION_DENIED');
        setErrorMessage(t.permissionDeniedDesc);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('DEVICE_NOT_FOUND');
        setErrorMessage('No camera device was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorType('IN_USE');
        setErrorMessage('Camera is currently in use by another application.');
      } else {
        setErrorType('UNKNOWN');
        setErrorMessage(err.message || 'Unable to open camera.');
      }
    }
  }, [stream, t.permissionDeniedDesc]);

  // Initial startup
  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Handle Torch toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Could not toggle flashlight:', e);
      }
    }
  };

  // Flip between environment (rear) and user (selfie) camera
  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Capture current video frame to high-res canvas
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsSnapping(true);

    // Provide haptic feedback on supported mobile devices
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // Ignored
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setTimeout(() => {
      // Stop stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onCapture(dataUrl);
    }, 200);
  };

  // Handle native file or camera pickers
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden file inputs for direct camera app and gallery */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={onClose}
          type="button"
          aria-label={t.cameraClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-sm font-medium hover:bg-white/25 active:scale-95 transition"
        >
          <X className="w-4 h-4" />
          <span>{t.cameraClose}</span>
        </button>

        <div className="flex items-center gap-2">
          {torchAvailable && permissionState === 'granted' && (
            <button
              onClick={toggleTorch}
              type="button"
              aria-label={t.cameraTorch}
              className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-90 ${
                torchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {permissionState === 'granted' && (
            <button
              onClick={flipCamera}
              type="button"
              aria-label={t.cameraFlip}
              className="p-2.5 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 active:scale-90 transition"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder Center / Permission State Display */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {permissionState === 'granted' && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Shutter flash effect */}
            {isSnapping && <div className="absolute inset-0 bg-white animate-ping opacity-75 z-30" />}

            {/* Note Alignment Guide Overlay */}
            <div className="absolute inset-6 sm:inset-12 pointer-events-none border-2 border-dashed border-white/60 rounded-2xl flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
              {/* Corner brackets */}
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-indigo-400 -mt-2 -ml-2 rounded-tl" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-indigo-400 -mt-2 -mr-2 rounded-tr" />
              </div>
              <div className="text-center px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs text-white/90 font-medium self-center shadow">
                {t.alignGuide}
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-indigo-400 -mb-2 -ml-2 rounded-bl" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-indigo-400 -mb-2 -mr-2 rounded-br" />
              </div>
            </div>
          </>
        )}

        {/* Loading Spinner */}
        {permissionState === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-white p-6 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">{t.cameraPermissionDesc}</p>
          </div>
        )}

        {/* Permission Denied / Error Screen */}
        {permissionState === 'denied' && (
          <div className="max-w-md mx-4 p-6 bg-slate-900/95 border border-slate-800 rounded-3xl text-white text-center shadow-2xl backdrop-blur-md z-30">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold mb-2">
              {errorType === 'PERMISSION_DENIED' ? t.permissionDeniedTitle : 'Camera Unavailable'}
            </h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {errorMessage || t.permissionDeniedDesc}
            </p>

            {/* Step by step browser instruction */}
            <div className="bg-slate-800/80 rounded-xl p-3.5 mb-5 text-left text-xs space-y-2 border border-slate-700/50">
              <p className="font-semibold text-slate-200">{t.permissionTipsTitle}</p>
              <p className="text-slate-300 leading-normal">{t.permissionTipIos}</p>
              <p className="text-slate-300 leading-normal">{t.permissionTipAndroid}</p>
            </div>

            <p className="text-xs text-slate-400 mb-3">{t.permissionFallback}</p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {t.fallbackButton}
              </button>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
              >
                {t.retryCamera}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 px-6 py-6 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around">
        {/* Upload / Gallery Button */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition active:scale-90"
        >
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Gallery</span>
        </button>

        {/* Big Shutter Button */}
        {permissionState === 'granted' ? (
          <button
            type="button"
            onClick={takeSnapshot}
            disabled={isSnapping}
            aria-label={t.snapButton}
            className="group relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition active:scale-95 disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform shadow-lg shadow-white/30" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="relative px-6 py-3.5 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition"
          >
            <Camera className="w-5 h-5" />
            {t.takePhoto}
          </button>
        )}

        {/* Native Camera Shortcut (Useful on iOS & Android for high-res native sensor) */}
        <button
          type="button"
          onClick={() => nativeCameraInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition active:scale-90"
          title="Direct phone camera capture"
        >
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Camera</span>
        </button>
      </div>
    </div>
  );
};
