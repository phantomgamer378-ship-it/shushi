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
          title: "OFFLINE — ENTRY BLOCKED",
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
          title: "ADMISSION GRANTED",
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
              title: "ALREADY CHECKED IN",
              detail: err.problem.detail,
              timestamp: new Date().toLocaleTimeString(),
            });
          } else if (err.problem.code === "TICKET_REVOKED") {
            setScannerState("REVOKED");
            setLastScanResult({
              state: "REVOKED",
              title: "TICKET REVOKED",
              detail: "This ticket has been revoked by event organizers.",
              timestamp: new Date().toLocaleTimeString(),
            });
          } else {
            setScannerState("INVALID");
            setLastScanResult({
              state: "INVALID",
              title: "INVALID TICKET",
              detail: err.problem.detail || "Ticket not recognized for this event.",
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        } else {
          setScannerState("NETWORK_ERROR");
          setLastScanResult({
            state: "NETWORK_ERROR",
            title: "VERIFICATION UNAVAILABLE",
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
    <div className="flex flex-col gap-4 bg-pitch text-cream p-5 border border-pitch/20 dark:border-white/20 shadow-brutal">
      {/* Top Status Bar: Network, Gate, Counters */}
      <div className="flex items-center justify-between gap-2 text-xs font-mono uppercase pb-3 border-b border-white/10">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold border ${
            isOnline
              ? "bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/40"
              : "bg-crimson/20 text-crimson border-crimson/40"
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? "NET: ONLINE" : "NET: OFFLINE (BLOCKED)"}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30 font-bold">
            IN: {sessionStats.admitted}
          </span>
          <span className="px-2 py-0.5 bg-crimson/20 text-crimson border border-crimson/30 font-bold">
            DENY: {sessionStats.rejected}
          </span>
        </div>
      </div>

      {/* Gate Selector */}
      <div className="flex items-center gap-2 bg-carbon border border-white/15 px-3 py-2 font-mono text-xs">
        <DoorOpen className="w-4 h-4 text-crimson shrink-0" />
        <label htmlFor="gate-input" className="text-cream/50 shrink-0 uppercase text-[10px]">
          GATE:
        </label>
        <input
          id="gate-input"
          type="text"
          value={gateName}
          onChange={(e) => setGateName(e.target.value)}
          className="flex-1 bg-transparent text-xs font-bold text-cream focus:outline-none uppercase"
          placeholder="Main Gate"
        />
      </div>

      {/* Camera Viewfinder */}
      <div className="relative aspect-square w-full border-2 border-white/20 bg-black flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border border-crimson/60 relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-crimson -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-crimson -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-crimson -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-crimson -mb-1 -mr-1" />
              <div className="absolute inset-x-0 h-0.5 bg-crimson top-1/2 shadow-[0_0_10px_#D72638]" />
            </div>
          </div>
        )}

        {!isScanning && (
          <div className="text-center p-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-carbon border border-white/15 flex items-center justify-center text-cream/40">
              <CameraOff className="w-8 h-8" />
            </div>
            <p className="font-mono text-xs text-cream/70 uppercase">
              {scannerState === "CAMERA_ERROR" ? "Camera Unavailable" : "Scanner Idle"}
            </p>
            {cameraError && <p className="font-mono text-[11px] text-crimson max-w-xs">{cameraError}</p>}
          </div>
        )}

        {scannerState === "VERIFYING" && (
          <div className="absolute inset-0 bg-pitch/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2 text-cream">
            <RefreshCw className="w-8 h-8 animate-spin text-crimson" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              ATOMIC VERIFICATION...
            </span>
          </div>
        )}
      </div>

      {/* Camera & Torch Controls */}
      <div className="flex items-center gap-2">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex-1 py-3 px-4 bg-crimson hover:bg-crimson/90 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-brutal transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>START VIEWFINDER</span>
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 py-3 px-4 bg-carbon hover:bg-black text-white font-mono font-bold text-xs uppercase border border-white/20 flex items-center justify-center gap-2 transition-all"
          >
            <CameraOff className="w-4 h-4" />
            <span>HALT SCANNER</span>
          </button>
        )}

        {isScanning && torchSupported && (
          <button
            onClick={toggleTorch}
            aria-label="Toggle flashlight"
            className={`p-3 border font-mono text-xs transition-colors ${
              torchOn
                ? "bg-cream text-pitch border-cream"
                : "bg-carbon border-white/20 text-cream"
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
            className="px-3 py-3 bg-carbon border border-white/20 font-mono text-[11px] text-cream max-w-[130px] uppercase focus:outline-none"
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
          className={`p-4 border-2 flex items-start gap-3 transition-all ${
            lastScanResult.state === "SUCCESS"
              ? "bg-[#16A34A]/15 border-[#16A34A] text-white"
              : lastScanResult.state === "DUPLICATE"
              ? "bg-amber-500/15 border-amber-500 text-amber-100"
              : "bg-crimson/15 border-crimson text-red-100"
          }`}
        >
          {lastScanResult.state === "SUCCESS" ? (
            <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
          ) : lastScanResult.state === "DUPLICATE" ? (
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-crimson shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-black text-sm uppercase">{lastScanResult.title}</span>
              <span className="font-mono text-[10px] opacity-75">{lastScanResult.timestamp}</span>
            </div>
            {lastScanResult.attendeeName && (
              <div className="font-display font-bold text-base text-cream mt-0.5 truncate uppercase">
                {lastScanResult.attendeeName}
              </div>
            )}
            <p className="font-mono text-xs opacity-90 mt-1">{lastScanResult.detail}</p>
          </div>
        </div>
      )}

      {/* Manual Token Fallback */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-3 border-t border-white/10">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-cream/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Manual ef:v1:... token entry"
            className="w-full pl-9 pr-3 py-2 bg-carbon border border-white/15 text-xs font-mono text-cream placeholder-cream/30 focus:outline-none focus:border-crimson"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-sand text-pitch hover:bg-cream text-xs font-mono font-bold uppercase transition-colors"
        >
          VERIFY
        </button>
      </form>
    </div>
  );
}
