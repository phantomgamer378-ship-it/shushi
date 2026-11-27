"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Search, Sparkles } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";

interface ScanResult {
  status: "ADMITTED" | "ALREADY_CHECKED_IN" | "INVALID" | "ERROR";
  title: string;
  detail: string;
  attendeeName?: string;
  timestamp: string;
}

export function QrScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Initialize camera list
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoInputs);

        // Prefer rear camera if available
        const rearCamera = videoInputs.find((d) =>
          d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear") || d.label.toLowerCase().includes("environment")
        );
        setSelectedCameraId(rearCamera ? rearCamera.deviceId : videoInputs[0]?.deviceId || "");
      } catch (err: any) {
        setCameraError("Camera permission denied or unsupported device.");
      }
    }
    getDevices();
  }, []);

  const handleScanSuccess = useCallback(async (rawText: string) => {
    const now = Date.now();
    // Duplicate frame suppression (3 second cooldown on same code)
    if (rawText === lastScannedTextRef.current && now - lastScannedTimeRef.current < 3000) {
      return;
    }
    lastScannedTextRef.current = rawText;
    lastScannedTimeRef.current = now;

    setIsProcessing(true);

    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(100);
    }

    try {
      const response = await apiClient<{
        status: string;
        attendee_name: string;
        gate_name: string;
        checked_in_at: string;
        message: string;
      }>(`events/${eventId}/check-in`, {
        method: "POST",
        body: JSON.stringify({
          raw_token: rawText,
          gate_name: "Mobile Scanner",
          idempotency_key: crypto.randomUUID(),
        }),
      });

      setLastScanResult({
        status: "ADMITTED",
        title: "Admission Granted",
        attendeeName: response.attendee_name,
        detail: `Gate: ${response.gate_name}`,
        timestamp: new Date(response.checked_in_at).toLocaleTimeString(),
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.problem.code === "ALREADY_CHECKED_IN") {
          setLastScanResult({
            status: "ALREADY_CHECKED_IN",
            title: "Already Checked In",
            detail: err.problem.detail,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else if (err.problem.code === "TICKET_REVOKED") {
          setLastScanResult({
            status: "INVALID",
            title: "Ticket Revoked",
            detail: "This ticket has been revoked by event organizers.",
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          setLastScanResult({
            status: "INVALID",
            title: "Invalid Ticket",
            detail: err.problem.detail || "Ticket not recognized.",
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else {
        setLastScanResult({
          status: "ERROR",
          title: "Network Error",
          detail: "Unable to reach verification backend. Fail closed.",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [eventId]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setCameraError(null);

    try {
      const codeReader = new BrowserQRCodeReader();
      const controls = await codeReader.decodeFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current,
        (result, error, controls) => {
          if (result) {
            handleScanSuccess(result.getText());
          }
        }
      );
      controlsRef.current = controls;
      setIsScanning(true);
    } catch (err: any) {
      setCameraError(err.message || "Failed to start camera viewfinder.");
      setIsScanning(false);
    }
  }, [selectedCameraId, handleScanSuccess]);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Teardown camera stream on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 p-4">
      {/* Viewfinder Card */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Viewfinder Target Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-indigo-500/80 rounded-2xl relative shadow-[0_0_50px_rgba(99,102,241,0.3)]">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br" />
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse top-1/2" />
            </div>
          </div>
        )}

        {!isScanning && (
          <div className="text-center p-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-400">
              <CameraOff className="w-8 h-8" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Camera is paused</p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col gap-2 text-white">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Validating Ticket...</span>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex items-center gap-3">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Camera className="w-4 h-4" />
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <CameraOff className="w-4 h-4" />
            Stop Camera
          </button>
        )}

        {cameras.length > 1 && (
          <button
            onClick={() => {
              const nextIndex = (cameras.findIndex((c) => c.deviceId === selectedCameraId) + 1) % cameras.length;
              setSelectedCameraId(cameras[nextIndex].deviceId);
              if (isScanning) {
                stopScanner();
                setTimeout(startScanner, 200);
              }
            }}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
            title="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          {cameraError}
        </div>
      )}

      {/* Result Card Presentation */}
      {lastScanResult && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
            lastScanResult.status === "ADMITTED"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/50"
              : lastScanResult.status === "ALREADY_CHECKED_IN"
              ? "bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-lg shadow-amber-950/50"
              : "bg-red-950/40 border-red-500/40 text-red-200 shadow-lg shadow-red-950/50"
          }`}
        >
          <div className="flex items-start gap-3">
            {lastScanResult.status === "ADMITTED" && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />}
            {lastScanResult.status === "ALREADY_CHECKED_IN" && <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />}
            {(lastScanResult.status === "INVALID" || lastScanResult.status === "ERROR") && (
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-base tracking-tight">{lastScanResult.title}</h4>
                <span className="text-xs opacity-75">{lastScanResult.timestamp}</span>
              </div>
              {lastScanResult.attendeeName && (
                <p className="text-lg font-extrabold text-white mt-1 truncate">{lastScanResult.attendeeName}</p>
              )}
              <p className="text-xs mt-1 opacity-90 leading-relaxed">{lastScanResult.detail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Code Input Fallback */}
      <form onSubmit={handleManualSubmit} className="pt-2 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Manual Token / Opaque ID"
          className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          Verify
        </button>
      </form>
    </div>
  );
}
