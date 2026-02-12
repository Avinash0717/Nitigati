"use client";

import { useState } from "react";
import Link from "next/link";
import OnboardingType from "@/components/providerOnboarding/OnboardingType";
import OnboardingDetails from "@/components/providerOnboarding/OnboardingDetails";
import OnboardingConfirmation from "@/components/providerOnboarding/OnboardingConfirmation";
import AI_Onboarding, {
    AIOnboardingFormData,
} from "@/components/providerOnboarding/AI_Onboarding";

// --- Page Local Interfaces ---

export interface OnboardingFormData {
    name: string;
    age: number | string;
    gender: string;
    location: string;
    phoneNumber: string;
    email: string;
    password: string;
    profilePicture: File | null;
    legalIdFront: File | null;
    legalIdBack: File | null;
}

export interface ProviderPayload extends OnboardingFormData {
    // Any additional fields transformed before API call can go here
}

export interface AIProviderPayload {
    onboarding_type: "ai";
    transcript: string;
    profile_picture: File | null;
    legal_id_front: File | null;
    legal_id_back: File | null;
}

// --- Controller Logic ---

export default function ProviderOnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [onboardingMethod, setOnboardingMethod] = useState<
        "manual" | "ai" | null
    >(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTypeSelect = (type: "manual" | "ai") => {
        setOnboardingMethod(type);
        setCurrentStep(2);
    };

    const handleDetailsSubmit = async (formData: OnboardingFormData) => {
        if (!onboardingMethod) {
            setCurrentStep(1);
            return;
        }
        setIsSubmitting(true);
        console.log("Starting Two-Step Submission...");

        try {
            // Build a single FormData with all text fields + images
            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("age", formData.age.toString());
            payload.append("gender", formData.gender);
            payload.append("location", formData.location);
            payload.append("phone_number", formData.phoneNumber);
            payload.append("email", formData.email);
            payload.append("password", formData.password);
            payload.append("onboarding_type", onboardingMethod);

            if (formData.profilePicture)
                payload.append("profile_picture", formData.profilePicture);
            if (formData.legalIdFront)
                payload.append("legal_id_front", formData.legalIdFront);
            if (formData.legalIdBack)
                payload.append("legal_id_back", formData.legalIdBack);

            const response = await fetch("/api/providers", {
                method: "POST",
                body: payload,
                // No Content-Type header — browser sets it with the correct boundary
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                    errorData.detail ||
                    "Failed to create provider",
                );
            }

            const data = await response.json();
            console.log("Provider created successfully:", data);
            setCurrentStep(3);
        } catch (err: any) {
            console.error("Onboarding Error:", err);
            alert(
                err.message ||
                "An unexpected error occurred. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAISubmit = async (formData: AIOnboardingFormData) => {
        setIsSubmitting(true);
        console.log("Starting AI Onboarding Submission...");

        try {
            const payload = new FormData();
            payload.append("onboarding_type", "ai");
            payload.append("transcript", formData.transcript);
            payload.append(
                "extracted_fields",
                JSON.stringify(formData.extractedFields),
            );

            if (formData.profilePicture)
                payload.append("profile_picture", formData.profilePicture);
            if (formData.legalIdFront)
                payload.append("legal_id_front", formData.legalIdFront);
            if (formData.legalIdBack)
                payload.append("legal_id_back", formData.legalIdBack);

            const response = await fetch("/api/providers/aiOnboarding", {
                method: "POST",
                body: payload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                    errorData.detail ||
                    "Failed to process AI onboarding",
                );
            }

            const data = await response.json();
            console.log("AI Onboarding validated successfully:", data);
            setCurrentStep(3);
        } catch (err: any) {
            console.error("AI Onboarding Error:", err);
            alert(
                err.message ||
                "An unexpected error occurred. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <OnboardingType onSelect={handleTypeSelect} />;
            case 2:
                if (onboardingMethod === "ai") {
                    return (
                        <AI_Onboarding
                            onSubmit={handleAISubmit}
                            onBack={() => setCurrentStep(1)}
                            onSwitchToManual={() =>
                                setOnboardingMethod("manual")
                            }
                            isLoading={isSubmitting}
                        />
                    );
                }
                return (
                    <OnboardingDetails
                        onSubmit={handleDetailsSubmit}
                        isLoading={isSubmitting}
                        onSwitchToAI={() =>
                            setOnboardingMethod("ai")
                        }
                    />
                );
            case 3:
                return <OnboardingConfirmation />;
            default:
                return <OnboardingType onSelect={handleTypeSelect} />;
        }
    };

    const getStepProgress = () => {
        return (currentStep / 3) * 100;
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return "Choose Onboarding Method";
            case 2:
                return "Tell us about yourself";
            case 3:
                return "Account Setup Complete";
            default:
                return "";
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50/30 font-sans selection:bg-emerald-100">
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

            <main className="max-w-7xl mx-auto py-12">
                {/* Progress Tracker */}
                <div className="max-w-4xl mx-auto px-4 mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">
                                Step {currentStep} of 3
                            </span>
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                                {getStepTitle()}
                            </h2>
                        </div>
                        <span className="text-sm font-black text-zinc-900">
                            {Math.round(getStepProgress())}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${getStepProgress()}%` }}
                        ></div>
                    </div>
                </div>

                {/* Dynamic Content */}
                {renderStep()}
            </main>

            {/* Footer */}
            <footer className="mt-auto py-12 border-t border-zinc-100 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-10 justify-center text-xs font-black uppercase tracking-widest text-zinc-400 mb-8">
                        <Link
                            href="#"
                            className="hover:text-emerald-500 transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-emerald-500 transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-emerald-500 transition-colors"
                        >
                            Contact Support
                        </Link>
                    </div>
                    <p className="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        © 2023 Nitigati Marketplace. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
