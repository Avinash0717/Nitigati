"use client";

import React, { useState } from "react";
import Link from "next/link";
import CustomerDetails from "@/components/customerOnboarding/CustomerDetails";
import CustomerOnboardingConfirmation from "@/components/customerOnboarding/CustomerOnboardingConfirmation";

export interface CustomerFormData {
    username: string;
    email: string;
    password: string;
    phone_number: string;
    profile_picture: File | null;
}

export type OnboardingStep = 1 | 2;

export default function CustomerOnboardingPage() {
    const [step, setStep] = useState<OnboardingStep>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDetailsSubmit = async (data: CustomerFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("name", data.username);
            formData.append("email", data.email);
            formData.append("password", data.password);
            formData.append("phone_number", data.phone_number);
            if (data.profile_picture) {
                formData.append("profile_picture", data.profile_picture);
            }

            const response = await fetch("/api/customer", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setStep(2);
            } else {
                // Handle field-specific errors or general detail error
                const errorMsg =
                    result.detail ||
                    (result.email && result.email[0]) ||
                    "Failed to create account. Please try again.";
                setError(errorMsg);
            }
        } catch (err) {
            console.error("Submission error:", err);
            setError(
                "An unexpected error occurred. Please check your connection.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <nav className="bg-white border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-emerald-500/20">
                            <span className="text-white font-black text-xl italic pt-1">
                                N
                            </span>
                        </div>
                        <span className="text-2xl font-black tracking-tight pt-1">
                            Nitigati
                        </span>
                    </Link>
                    <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-2 rounded-lg font-bold text-sm transition-colors">
                        Help
                    </button>
                </div>
            </nav>

            <div className="max-w-[1200px] mx-auto px-4 py-12">
                <div className="mb-8">
                    <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.2em] mb-2">
                        STEP {step} OF 2
                    </p>
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-4xl font-bold text-[#1E293B]">
                            {step === 1
                                ? "Create your account"
                                : "Account Created Successfully"}
                        </h1>
                        <span className="text-[#059669] font-semibold">
                            {step === 1 ? "50%" : "100%"}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00FF85] transition-all duration-500 ease-out"
                            style={{ width: step === 1 ? "50%" : "100%" }}
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    {step === 1 ? (
                        <CustomerDetails
                            onSubmit={handleDetailsSubmit}
                            isSubmitting={isSubmitting}
                            error={error}
                        />
                    ) : (
                        <CustomerOnboardingConfirmation />
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-8 text-center border-t border-gray-100">
                <div className="flex justify-center gap-8 mb-4 text-sm text-[#64748B]">
                    <a href="#" className="hover:text-gray-900">
                        Privacy Policy
                    </a>
                    <span className="text-gray-300">•</span>
                    <a href="#" className="hover:text-gray-900">
                        Terms of Service
                    </a>
                    <span className="text-gray-300">•</span>
                    <a href="#" className="hover:text-gray-900">
                        Contact Support
                    </a>
                </div>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">
                    © 2024 NITIGATI INC. ALL RIGHTS RESERVED.
                </p>
            </footer>
        </main>
    );
}
