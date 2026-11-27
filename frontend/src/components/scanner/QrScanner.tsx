"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  Flashlight,
  DoorOpen,
  Search,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";

type ScannerState =
  | "IDLE"
  | "PERMISSION_REQUEST"
  | "SCANNING"
  | "VERIFYING"
  | "SUCCESS"
  | "DUPLICATE"
  | "INVALID"
  | "REVOKED"
  | "NETWORK_ERROR"
  | "CAMERA_ERROR";

interface ScanResult {
  state: ScannerState;
  title: string;
  detail: string;
  attendeeName?: string;
  timestamp: string;
}

export function QrScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const inFlightRef = useRef<boolean>(false);

  const [scannerState, setScannerState] = useState<ScannerState>("IDLE");
  const [isScanning, setIsScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [gateName, setGateName] = useState("Main Gate");
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ admitted: 0, rejected: 0 });

  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Monitor network connectivity (fail-closed offline)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Initialize camera list preferring rear camera
  useEffect(() => {
    async function getDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoInputs);

        const rearCamera = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );
        setSelectedCameraId(rearCamera ? rearCamera.deviceId : videoInputs[0]?.deviceId || "");
      } catch {
        setScannerState("CAMERA_ERROR");
        setCameraError("Camera permission denied or unsupported device.");
      }
    }
    getDevices();
  }, []);

  const handleScanSuccess = useCallback(
    async (rawText: string) => {
      const now = Date.now();
      // Duplicate frame suppression (3 second cooldown on same code)
      if (rawText === lastScannedTextRef.current && now - lastScannedTimeRef.current < 3000) {
        return;
      }
      // Prevent concurrent check-in requests
      if (inFlightRef.current) return;

      lastScannedTextRef.current = rawText;
      lastScannedTimeRef.current = now;
      inFlightRef.current = true;
      setScannerState("VERIFYING");

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(80);
      }

      if (!navigator.onLine) {
        inFlightRef.current = false;
        setScannerState("NETWORK_ERROR");
        setLastScanResult({
          state: "NETWORK_ERROR",
          title: "Offline — Entry Blocked",
          detail: "Verification unavailable offline. Never grant entry without server confirmation.",
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
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
            gate_name: gateName || "Main Gate",
            idempotency_key: crypto.randomUUID(),
          }),
        });

        setScannerState("SUCCESS");
        setSessionStats((s) => ({ ...s, admitted: s.admitted + 1 }));
        setLastScanResult({
          state: "SUCCESS",
          title: "Admission Granted",
          attendeeName: response.attendee_name,
          detail: `Gate: ${response.gate_name}`,
          timestamp: new Date(response.checked_in_at).toLocaleTimeString(),
        });
      } catch (err: any) {
        setSessionStats((s) => ({ ...s, rejected: s.rejected + 1 }));
        if (err instanceof ApiError) {
          if (err.problem.code === "ALREADY_CHECKED_IN") {
            setScannerState("DUPLICATE");
            setLastScanResult({
              state: "DUPLICATE",
              title: "Already Checked In",
              detail: err.problem.detail,
              timestamp: new Date().toLocaleTimeString(),
            });
          } else if (err.problem.code === "TICKET_REVOKED") {
            setScannerState("REVOKED");
            setLastScanResult({
              state: "REVOKED",
              title: "Ticket Revoked",
              detail: "This ticket has been revoked by event organizers.",
              timestamp: new Date().toLocaleTimeString(),
            });
          } else {
            setScannerState("INVALID");
            setLastScanResult({
              state: "INVALID",
              title: "Invalid Ticket",
              detail: err.problem.detail || "Ticket not recognized for this event.",
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        } else {
          setScannerState("NETWORK_ERROR");
          setLastScanResult({
            state: "NETWORK_ERROR",
            title: "Verification Unavailable",
            detail: "Unable to reach backend. Fail closed.",
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [eventId, gateName]
  );

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
    setTorchSupported(false);
    setScannerState("IDLE");
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setCameraError(null);
    setScannerState("PERMISSION_REQUEST");

    try {
      const codeReader = new BrowserQRCodeReader();
      const controls = await codeReader.decodeFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current,
        (result) => {
          if (result) {
            handleScanSuccess(result.getText());
          }
        }
      );
      controlsRef.current = controls;
      setIsScanning(true);
      setScannerState("SCANNING");

      // Check torch capability
      const stream = videoRef.current.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()?.[0];
      const capabilities = track?.getCapabilities?.() as any;
      if (capabilities?.torch) {
        setTorchSupported(true);
      }
    } catch (err: any) {
      setScannerState("CAMERA_ERROR");
      setCameraError(err.message || "Failed to start camera viewfinder.");
      setIsScanning(false);
    }
  }, [selectedCameraId, handleScanSuccess]);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()?.[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {
      // Ignore unsupported torch errors
    }
  };

  // Stop camera on unmount or tab backgrounding
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopScanner();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
    <div className="max-w-md mx-auto flex flex-col gap-4 bg-[#10172A] text-white p-4 rounded-[24px] border border-white/10 shadow-2xl">
      {/* Top Status Bar: Network, Gate, Counters */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
            isOnline
              ? "bg-[#16A34A]/15 text-emerald-400 border border-[#16A34A]/30"
              : "bg-[#DC4545]/20 text-red-400 border border-[#DC4545]/40"
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? "Online" : "Offline (Blocked)"}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#16A34A]/15 text-emerald-400">
            IN: {sessionStats.admitted}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#DC4545]/15 text-red-400">
            DENY: {sessionStats.rejected}
          </span>
        </div>
      </div>

      {/* Gate Selector */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-[10px] px-3 py-2">
        <DoorOpen className="w-4 h-4 text-[#36C8E8] shrink-0" />
        <label htmlFor="gate-input" className="text-xs text-slate-400 shrink-0">
          Gate:
        </label>
        <input
          id="gate-input"
          type="text"
          value={gateName}
          onChange={(e) => setGateName(e.target.value)}
          className="flex-1 bg-transparent text-xs font-semibold text-white focus:outline-none"
          placeholder="Main Gate"
        />
      </div>

      {/* Camera Viewfinder */}
      <div className="relative aspect-square w-full rounded-[20px] overflow-hidden border border-white/15 bg-black flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-60 h-60 border-2 border-[#36C8E8]/80 rounded-2xl relative shadow-[0_0_40px_rgba(54,200,232,0.2)]">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#36C8E8] -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#36C8E8] -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#36C8E8] -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#36C8E8] -mb-1 -mr-1 rounded-br" />
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#36C8E8] to-transparent top-1/2" />
            </div>
          </div>
        )}

        {!isScanning && (
          <div className="text-center p-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
              <CameraOff className="w-8 h-8" />
            </div>
            <p className="text-sm text-slate-300 font-medium">
              {scannerState === "CAMERA_ERROR" ? "Camera Unavailable" : "Scanner Paused"}
            </p>
            {cameraError && <p className="text-xs text-red-400 max-w-xs">{cameraError}</p>}
          </div>
        )}

        {scannerState === "VERIFYING" && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center flex-col gap-2 text-white">
            <RefreshCw className="w-8 h-8 animate-spin text-[#36C8E8]" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Verifying Credential...
            </span>
          </div>
        )}
      </div>

      {/* Camera & Torch Controls */}
      <div className="flex items-center gap-2">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex-1 py-3 px-4 rounded-[10px] bg-[#635BFF] hover:bg-[#5249F5] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/30 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Start Camera</span>
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 py-3 px-4 rounded-[10px] bg-[#DC4545] hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </button>
        )}

        {isScanning && torchSupported && (
          <button
            onClick={toggleTorch}
            aria-label="Toggle flashlight"
            className={`p-3 rounded-[10px] border transition-colors ${
              torchOn
                ? "bg-[#EAAA24]/20 border-[#EAAA24] text-[#EAAA24]"
                : "bg-slate-900 border-white/10 text-slate-300"
            }`}
          >
            <Flashlight className="w-4 h-4" />
          </button>
        )}

        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              if (isScanning) {
                stopScanner();
              }
            }}
            aria-label="Select camera"
            className="px-3 py-3 rounded-[10px] bg-slate-900 border border-white/10 text-xs text-white max-w-[130px]"
          >
            {cameras.map((cam, idx) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* High-Contrast Result Banner */}
      {lastScanResult && (
        <div
          role="status"
          aria-live="assertive"
          className={`p-4 rounded-[16px] border-2 flex items-start gap-3 transition-all ${
            lastScanResult.state === "SUCCESS"
              ? "bg-[#16A34A]/20 border-[#16A34A] text-white"
              : lastScanResult.state === "DUPLICATE"
              ? "bg-[#EAAA24]/20 border-[#EAAA24] text-amber-100"
              : "bg-[#DC4545]/20 border-[#DC4545] text-red-100"
          }`}
        >
          {lastScanResult.state === "SUCCESS" ? (
            <CheckCircle2 className="w-7 h-7 text-[#16A34A] shrink-0" />
          ) : lastScanResult.state === "DUPLICATE" ? (
            <AlertTriangle className="w-7 h-7 text-[#EAAA24] shrink-0" />
          ) : (
            <XCircle className="w-7 h-7 text-[#DC4545] shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-base">{lastScanResult.title}</span>
              <span className="font-mono text-[11px] opacity-80">{lastScanResult.timestamp}</span>
            </div>
            {lastScanResult.attendeeName && (
              <div className="font-bold text-lg text-white mt-0.5 truncate">
                {lastScanResult.attendeeName}
              </div>
            )}
            <p className="text-xs opacity-90 mt-1">{lastScanResult.detail}</p>
          </div>
        </div>
      )}

      {/* Manual Token Fallback */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-2 border-t border-white/10">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Manual ef:v1:... token entry"
            className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-[10px] bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
        >
          Verify
        </button>
      </form>
    </div>
  );
}
