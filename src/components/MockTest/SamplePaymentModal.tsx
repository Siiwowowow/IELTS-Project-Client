/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  IconCrown,
  IconX,
  IconCheck,
  IconShieldCheck,
  IconSparkles,
  IconLoader2,
  IconCreditCard,
  IconDeviceMobile,
  IconArrowRight,
  IconLock,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { mockTestService } from "@/services/mocktest.services";
import Link from "next/link";

interface SamplePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mockTestTitle?: string;
}

type PaymentMethod = "bkash" | "nagad" | "card";

export default function SamplePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  mockTestTitle,
}: SamplePaymentModalProps) {
  const { user, setUser } = useUser();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("bkash");
  const [isLoading, setIsLoading] = useState(false);

  // Form dummy fields
  const [phoneNumber, setPhoneNumber] = useState("01712345678");
  const [trxId, setTrxId] = useState("TRX9K8L7M6");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardHolder, setCardHolder] = useState(user?.name || "IELTS Candidate");

  if (!isOpen) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to your student account first to unlock Premium access!");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend to activate isPremium in DB
      const res = await mockTestService.upgradeToPremium({
        method: selectedMethod,
        trxId: selectedMethod === "card" ? `CARD-${Date.now()}` : trxId,
        phoneNumber: selectedMethod !== "card" ? phoneNumber : undefined,
        amount: 999,
      });

      if (res.data?.success) {
        // Optimistically update the auth user state in browser session
        if (setUser && user) {
          setUser({
            ...user,
            isPremium: true,
          });
        }

        toast.success("🎉 Payment Successful! All Premium Mock Tests are now permanently unlocked!", {
          duration: 5000,
        });

        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        throw new Error(res.data?.message || "Failed to process demo payment");
      }
    } catch (err: any) {
      console.warn("Payment API fallback:", err);
      // Even if network fallback occurs, grant local demo unlock so user is never blocked
      if (setUser && user) {
        setUser({
          ...user,
          isPremium: true,
        });
      }
      toast.success("🎉 Demo Payment Accepted! All Premium Mock Tests unlocked!");
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-purple-950/20 text-slate-900 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header Accent */}
        <div className="relative overflow-hidden bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white">
          <div className="absolute -right-8 -top-8 size-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-12 bottom-0 size-20 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-9 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition active:scale-95 cursor-pointer z-10"
            aria-label="Close modal"
          >
            <IconX size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <IconCrown size={26} className="text-white fill-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-100 border border-white/30">
                <IconSparkles size={11} />
                <span>Full Mock Test Pass</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Unlock Premium CBT Mock Tests
              </h2>
            </div>
          </div>

          {mockTestTitle && (
            <p className="mt-2 text-xs text-amber-100 font-semibold line-clamp-1">
              Unlocking: <span className="text-white underline">{mockTestTitle}</span> & all other premium tests
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Unauthenticated notice */}
          {!user && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <IconLock size={20} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-sm">Student Login Required</p>
                <p className="mt-0.5 text-amber-700">
                  Please log in before upgrading so your Premium Pass is permanently tied to your account.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1 font-black text-amber-900 underline hover:text-black"
                >
                  <span>Go to Login</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* Pricing & Benefits Showcase */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  CBT Access Package
                </span>
                <span className="text-base font-black text-slate-900">
                  Lifetime All-Inclusive CBT Pass
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-2xl font-black text-emerald-600">৳999</span>
                  <span className="text-xs text-slate-400 line-through">৳1,999</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  50% OFF (Demo Sample)
                </span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 pt-1">
              <div className="flex items-center gap-2">
                <IconCircleCheck size={16} className="text-emerald-500 shrink-0" />
                <span>All 4-Module Mock Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCircleCheck size={16} className="text-emerald-500 shrink-0" />
                <span>Official Cambridge CBT Timers</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCircleCheck size={16} className="text-emerald-500 shrink-0" />
                <span>Instant Auto & AI Band Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCircleCheck size={16} className="text-emerald-500 shrink-0" />
                <span>Unlimited Re-takes & Analytics</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Select Sample Payment Gateway
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* bKash */}
              <button
                type="button"
                onClick={() => setSelectedMethod("bkash")}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedMethod === "bkash"
                    ? "border-pink-500 bg-pink-50/50 shadow-md shadow-pink-500/10 text-pink-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                {selectedMethod === "bkash" && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                    <IconCheck size={10} strokeWidth={3} />
                  </span>
                )}
                <div className="size-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-black text-xs">
                  bK
                </div>
                <span className="mt-1.5 text-xs font-extrabold">bKash</span>
                <span className="text-[9px] text-pink-700/80 font-semibold">Instant Trx</span>
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => setSelectedMethod("nagad")}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedMethod === "nagad"
                    ? "border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 text-orange-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                {selectedMethod === "nagad" && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                    <IconCheck size={10} strokeWidth={3} />
                  </span>
                )}
                <div className="size-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                  না
                </div>
                <span className="mt-1.5 text-xs font-extrabold">Nagad</span>
                <span className="text-[9px] text-orange-700/80 font-semibold">Instant Trx</span>
              </button>

              {/* Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedMethod === "card"
                    ? "border-purple-600 bg-purple-50/50 shadow-md shadow-purple-600/10 text-purple-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                {selectedMethod === "card" && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <IconCheck size={10} strokeWidth={3} />
                  </span>
                )}
                <div className="size-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <IconCreditCard size={18} />
                </div>
                <span className="mt-1.5 text-xs font-extrabold">Card</span>
                <span className="text-[9px] text-purple-700/80 font-semibold">Visa/Master</span>
              </button>
            </div>
          </div>

          {/* Form fields based on selected method */}
          <form onSubmit={handlePayment} className="space-y-4">
            {selectedMethod !== "card" ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Merchant Number:</span>
                  <span className="font-mono font-bold text-slate-900">01700-000000 (Demo)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your {selectedMethod === "bkash" ? "bKash" : "Nagad"} Account Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      placeholder="017XXXXXXXX"
                      className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:border-purple-600 focus:outline-hidden"
                    />
                    <IconDeviceMobile size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    required
                    placeholder="Enter TrxID"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold uppercase focus:border-purple-600 focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    💡 Sample TrxID is prefilled. You can click &quot;Pay &amp; Unlock&quot; to test.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:border-purple-600 focus:outline-hidden"
                    />
                    <IconCreditCard size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-center focus:border-purple-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-center focus:border-purple-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold">
              <IconShieldCheck size={16} className="text-emerald-500" />
              <span>Simulated Payment Gateway (Safe Sandbox Mode)</span>
            </div>

            {!user && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconAlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span className="font-semibold">Log in to your candidate account to unlock Premium access.</span>
                </div>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shrink-0 transition"
                >
                  Log In
                </Link>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading || !user}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <IconLoader2 size={18} className="animate-spin" />
                  <span>Activating Premium CBT Pass...</span>
                </>
              ) : (
                <>
                  <IconSparkles size={18} />
                  <span>Pay ৳999 &amp; Unlock All Premium Tests (Demo)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
