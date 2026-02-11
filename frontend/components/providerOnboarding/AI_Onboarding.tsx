"use client";

import React, { useState, useRef } from "react";
import {
    Camera,
    Upload,
    Mic,
    MicOff,
    ArrowRight,
    ArrowLeft,
    Check,
    RotateCcw
} from "lucide-react";

export interface AIOnboardingFormData {
    transcript: string;
    profilePicture: File | null;
    legalIdFront: File | null;
    legalIdBack: File | null;
}

interface AI_OnboardingProps {
    onSubmit: (data: AIOnboardingFormData) => void;
    onBack: () => void;
    onSwitchToManual: () => void;
    isLoading: boolean;
}

export default function AI_Onboarding({
    onSubmit,
    onBack,
    onSwitchToManual,
    isLoading
}: AI_OnboardingProps) {
    const [transcript, setTranscript] = useState("I am a carpenter with 10 years of experience in...");
    const [isRecording, setIsRecording] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [legalIdFront, setLegalIdFront] = useState<File | null>(null);
    const [legalIdBack, setLegalIdBack] = useState<File | null>(null);

    // Previews
    const [previews, setPreviews] = useState<{
        profile: string | null;
        front: string | null;
        back: string | null;
    }>({ profile: null, front: null, back: null });

    const fileRefs = {
        profile: useRef<HTMLInputElement>(null),
        front: useRef<HTMLInputElement>(null),
        back: useRef<HTMLInputElement>(null),
    };

    const handleFileChange = (type: "profile" | "front" | "back", e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
            };
            reader.readAsDataURL(file);

            if (type === "profile") setProfilePicture(file);
            if (type === "front") setLegalIdFront(file);
            if (type === "back") setLegalIdBack(file);
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // In a real app, this would trigger Web Speech API
        if (!isRecording) {
            setTranscript("I am a carpenter with 10 years of experience in New York. I specialize in home renovations and custom furniture...");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            transcript,
            profilePicture,
            legalIdFront,
            legalIdBack
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            {/* Left Column: Image Uploads */}
            <div className="space-y-6">
                {/* Profile Photo */}
                <div className="bg-white rounded-[32px] p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
                        Profile Photo
                    </h3>
                    <div
                        onClick={() => fileRefs.profile.current?.click()}
                        className="aspect-square rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group relative overflow-hidden"
                    >
                        {previews.profile ? (
                            <img src={previews.profile} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-zinc-400" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400">Upload Photo</span>
                            </>
                        )}
                        <input type="file" ref={fileRefs.profile} className="hidden" onChange={(e) => handleFileChange("profile", e)} accept="image/*" />
                    </div>
                </div>

                {/* ID Verification */}
                <div className="bg-white rounded-[32px] p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
                        ID Verification
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => fileRefs.front.current?.click()}
                            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden"
                        >
                            {previews.front ? (
                                <img src={previews.front} className="w-full h-full object-cover" alt="ID Front" />
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Front Side</span>
                                </>
                            )}
                            <input type="file" ref={fileRefs.front} className="hidden" onChange={(e) => handleFileChange("front", e)} accept="image/*" />
                        </div>
                        <div
                            onClick={() => fileRefs.back.current?.click()}
                            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden"
                        >
                            {previews.back ? (
                                <img src={previews.back} className="w-full h-full object-cover" alt="ID Back" />
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Back Side</span>
                                </>
                            )}
                            <input type="file" ref={fileRefs.back} className="hidden" onChange={(e) => handleFileChange("back", e)} accept="image/*" />
                        </div>
                    </div>
                </div>

                {/* Back to choice */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 font-bold text-sm px-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to choice
                </button>
            </div>

            {/* Right Column: AI Assistant Interaction */}
            <div className="relative">
                <div className="bg-white rounded-[40px] p-12 border border-zinc-100 shadow-xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-30"></div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-8">
                        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-300'}`}></div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                            {isRecording ? "AI Is Active" : "AI Is Ready"}
                        </span>
                    </div>

                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">
                        Tell me about yourself
                    </h2>
                    <p className="text-zinc-400 font-medium max-w-sm mb-12">
                        Just speak naturally. Mention your skills, years of experience, and location.
                    </p>

                    {/* Transcript Box */}
                    <div className="w-full max-w-xl relative mb-12">
                        <div className="bg-zinc-50 rounded-[32px] p-10 border border-zinc-100 group-focus-within:border-emerald-500 transition-colors relative min-h-[160px] flex items-center justify-center">
                            <span className="absolute left-6 top-8 text-4xl text-emerald-500/20 font-serif leading-none italic">"</span>
                            <p className="text-sm font-black text-zinc-700 leading-relaxed italic pr-4">
                                {transcript}
                                {isRecording && <span className="inline-block w-1.5 h-5 bg-emerald-400 ml-1 translate-y-1 animate-pulse" />}
                            </p>
                        </div>
                        {/* Quote bubble tail */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-zinc-50 border-r border-b border-zinc-100 rotate-45"></div>
                    </div>

                    {/* Mic Button */}
                    <div className="relative mb-12">
                        <div className={`absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 transition-all duration-500 ${isRecording ? 'scale-150' : 'scale-0 group-hover:scale-110'}`}></div>
                        <button
                            onClick={toggleRecording}
                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg
                                ${isRecording ? 'bg-zinc-900 text-white scale-90' : 'bg-emerald-400 text-black hover:scale-110 shadow-emerald-400/30'}`}
                        >
                            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <p className={`text-sm font-black tracking-tight transition-colors ${isRecording ? 'text-emerald-500' : 'text-zinc-900'}`}>
                            {isRecording ? "Listening..." : "Click to start"}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                            {isRecording ? "Tap to stop recording" : "Use your microphone to record"}
                        </p>
                    </div>

                    {/* Waveform Visualization (Simple CSS Animation) */}
                    <div className="flex items-center gap-1.5 h-8">
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                            <div
                                key={i}
                                className={`w-1.5 bg-emerald-400 rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce' : 'opacity-20 translate-y-1'}`}
                                style={{
                                    height: isRecording ? `${h * 100}%` : '20%',
                                    animationDelay: `${i * 100}ms`,
                                    animationDuration: '600ms'
                                }}
                            />
                        ))}
                    </div>

                    {/* Submit Section */}
                    <div className="mt-12 w-full pt-12 border-t border-zinc-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <button
                            onClick={onSwitchToManual}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-8 py-4 rounded-2xl font-black text-sm transition-all"
                        >
                            Switch to Manual
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !transcript}
                            className={`px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-[0.98] shadow-lg
                                ${isLoading ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none' : 'bg-emerald-400 text-black hover:bg-emerald-500 shadow-emerald-400/20'}`}
                        >
                            {isLoading ? "Processing..." : "Complete Setup"}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
