"use client";

import { useState, useEffect } from "react";
import { wellnessConfirmQrisPayment, wellnessEnrollProgram } from "@/wellness/actions/account";
import {
  X,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Video,
} from "lucide-react";

export interface QrisInvoiceData {
  id: string;
  programId: string;
  programTitle: string;
  price: number;
  status: string;
  attendanceMode?: string;
  paymentReference: string | null;
  invoiceExpiresAt: Date | string | null;
  locationType?: string | null;
  venueAddress?: string | null;
}

interface QrisCheckoutModalProps {
  isOpen: boolean;
  invoice: QrisInvoiceData | null;
  onClose: () => void;
  onSuccess: (programId: string) => void;
  programLocationType?: string | null;
  programVenue?: string | null;
}

export function QrisCheckoutModal({
  isOpen,
  invoice,
  onClose,
  onSuccess,
  programLocationType,
  programVenue,
}: QrisCheckoutModalProps) {
  const [currentInvoice, setCurrentInvoice] = useState<QrisInvoiceData | null>(invoice);
  const [attendanceMode, setAttendanceMode] = useState<"IN_PERSON" | "VIRTUAL">(
    (invoice?.attendanceMode as "IN_PERSON" | "VIRTUAL") || "VIRTUAL"
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(900);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState(false);

  useEffect(() => {
    setCurrentInvoice(invoice);
    if (invoice?.attendanceMode) {
      setAttendanceMode(invoice.attendanceMode as "IN_PERSON" | "VIRTUAL");
    }
    setErrorMsg(null);
    setPaidSuccess(false);
  }, [invoice]);

  useEffect(() => {
    if (!isOpen || !currentInvoice) return;

    const updateTimer = () => {
      if (!currentInvoice.invoiceExpiresAt) {
        setSecondsLeft(900);
        return;
      }
      const expiry = new Date(currentInvoice.invoiceExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isOpen, currentInvoice]);

  if (!isOpen || !currentInvoice) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isExpired = secondsLeft <= 0;

  const handleModeChange = async (newMode: "IN_PERSON" | "VIRTUAL") => {
    setAttendanceMode(newMode);
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await wellnessEnrollProgram(currentInvoice.programId, newMode);
      if (res.success && res.data) {
        setCurrentInvoice(res.data);
      } else {
        setErrorMsg(res.message || "Could not update attendance preference.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVerifyPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await wellnessConfirmQrisPayment(currentInvoice.id);
      if (res.success) {
        setPaidSuccess(true);
        setTimeout(() => {
          onSuccess(currentInvoice.programId);
        }, 900);
      } else {
        setErrorMsg(res.message || "Payment verification failed.");
      }
    } catch {
      setErrorMsg("Unable to verify payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateQris = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await wellnessEnrollProgram(currentInvoice.programId, attendanceMode);
      if (res.success && res.data) {
        setCurrentInvoice(res.data);
      } else {
        setErrorMsg(res.message || "Could not refresh QRIS code.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const isHybridOrOnsite =
    programLocationType === "ONSITE" ||
    programLocationType === "HYBRID" ||
    currentInvoice.locationType === "ONSITE" ||
    currentInvoice.locationType === "HYBRID";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        data-lenis-prevent
        className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-zinc-900 dark:text-white" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              QRIS Payment Checkout
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Program & Fee Summary */}
          <div className="p-4 rounded-2xl glass-panel-subtle space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Program Enrollment</span>
              <span className="font-mono">{currentInvoice.paymentReference}</span>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              {currentInvoice.programTitle}
            </h3>

            {/* Attendance Mode Selector (On-Site vs Virtual) */}
            {isHybridOrOnsite && (
              <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block">
                  Pilihan Kehadiran Peserta:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("IN_PERSON")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      attendanceMode === "IN_PERSON"
                        ? "chrome-button shadow-sm"
                        : "glass-panel-subtle text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hadir di Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("VIRTUAL")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      attendanceMode === "VIRTUAL"
                        ? "chrome-button shadow-sm"
                        : "glass-panel-subtle text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>Live Stream Zoom</span>
                  </button>
                </div>
                {(programVenue || currentInvoice.venueAddress) && attendanceMode === "IN_PERSON" && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    Studio Venue: {programVenue || currentInvoice.venueAddress}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-baseline justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Total Payment
              </span>
              <span className="text-base font-bold text-zinc-900 dark:text-white">
                Rp {currentInvoice.price.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* 15-Minute Countdown */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl glass-panel-subtle">
            <span className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" /> Payment Window (15 Mins)
            </span>
            <span
              className={`font-mono text-xs font-semibold ${
                isExpired
                  ? "text-red-600 dark:text-red-400"
                  : secondsLeft < 180
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-900 dark:text-white"
              }`}
            >
              {isExpired ? "EXPIRED" : formattedTime}
            </span>
          </div>

          {/* QRIS Visual Matrix */}
          <div className="relative mx-auto w-44 h-44 rounded-2xl bg-white p-3.5 flex flex-col items-center justify-center border border-zinc-200 shadow-sm">
            <svg
              viewBox="0 0 100 100"
              className={`w-full h-full text-zinc-950 ${isExpired ? "opacity-20 blur-[2px]" : ""}`}
              fill="currentColor"
            >
              <path d="M5,5 h28 v28 h-28 z M10,10 v18 h18 v-18 z M14,14 h10 v10 h-10 z" />
              <path d="M67,5 h28 v28 h-28 z M72,10 v18 h18 v-18 z M76,14 h10 v10 h-10 z" />
              <path d="M5,67 h28 v28 h-28 z M10,72 v18 h18 v-18 z M14,76 h10 v10 h-10 z" />
              <rect x="38" y="8" width="6" height="6" />
              <rect x="48" y="8" width="12" height="6" />
              <rect x="38" y="18" width="10" height="6" />
              <rect x="54" y="18" width="6" height="12" />
              <rect x="38" y="28" width="12" height="6" />
              <rect x="8" y="38" width="12" height="6" />
              <rect x="26" y="38" width="18" height="6" />
              <rect x="50" y="38" width="12" height="6" />
              <rect x="68" y="38" width="10" height="6" />
              <rect x="84" y="38" width="10" height="6" />
              <rect x="8" y="48" width="6" height="12" />
              <rect x="20" y="48" width="12" height="6" />
              <rect x="38" y="44" width="24" height="12" />
              <rect x="68" y="48" width="12" height="6" />
              <rect x="86" y="48" width="8" height="12" />
              <rect x="20" y="58" width="14" height="6" />
              <rect x="68" y="58" width="14" height="6" />
              <rect x="38" y="62" width="10" height="10" />
              <rect x="54" y="64" width="8" height="8" />
              <rect x="38" y="76" width="16" height="6" />
              <rect x="60" y="76" width="12" height="6" />
              <rect x="78" y="70" width="16" height="12" />
              <rect x="38" y="86" width="8" height="8" />
              <rect x="52" y="86" width="18" height="8" />
              <rect x="76" y="86" width="18" height="8" />
            </svg>

            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              QRIS Instant Payment
            </span>

            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs rounded-2xl p-4 text-center">
                <p className="text-xs text-white font-medium mb-2">QR Code Expired</p>
                <button
                  type="button"
                  onClick={handleRegenerateQris}
                  disabled={isRefreshing}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh QRIS
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {paidSuccess ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Payment confirmed! Opening your program...</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={isProcessing || isExpired}
                className="w-full py-2.5 rounded-xl chrome-button text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Confirming Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Confirm QRIS Payment
                  </>
                )}
              </button>
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                Scan with any mobile banking or e-wallet app to complete enrollment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
