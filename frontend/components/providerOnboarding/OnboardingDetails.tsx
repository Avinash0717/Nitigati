"use client";

import { useState } from "react";
import type { OnboardingFormData } from "@/app/providerOnboarding/page";

interface OnboardingDetailsProps {
    onSubmit: (data: OnboardingFormData) => void;
    isLoading: boolean;
}

export default function OnboardingDetails({
    onSubmit,
    isLoading,
}: OnboardingDetailsProps) {
    const [formData, setFormData] = useState<OnboardingFormData>({
        name: "",
        age: "",
        gender: "",
        location: "Mumbai, India", // Default
        phoneNumber: "",
        email: "",
        password: "",
        profilePicture: null,
        legalIdFront: null,
        legalIdBack: null,
    });

    const [previews, setPreviews] = useState<{
        profile: string | null;
        idFront: string | null;
        idBack: string | null;
    }>({
        profile: null,
        idFront: null,
        idBack: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: "profilePicture" | "legalIdFront" | "legalIdBack",
    ) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, [field]: file }));

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const previewKey =
                    field === "profilePicture"
                        ? "profile"
                        : field === "legalIdFront"
                          ? "idFront"
                          : "idBack";
                setPreviews((prev) => ({
                    ...prev,
                    [previewKey]: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenderChange = (gender: string) => {
        setFormData((prev) => ({ ...prev, gender }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses =
        "w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all";
    const labelClasses = "block text-sm font-black text-zinc-900 mb-3 ml-1";

    return (
        <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 lg:p-16 shadow-2xl shadow-zinc-200/50">
                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center gap-6 pb-8 border-b border-zinc-50">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-zinc-100 flex items-center justify-center transition-transform group-hover:scale-105">
                                {previews.profile ? (
                                    <img
                                        src={previews.profile}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                                <span>➕</span>
                                <input
                                    type="file"
                                    name="profilePicture"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                        handleFileChange(e, "profilePicture")
                                    }
                                    required
                                />
                            </label>
                        </div>
                        <div className="text-center">
                            <h3 className="font-black text-zinc-900 tracking-tight">
                                Profile Picture
                            </h3>
                            <p className="text-xs font-bold text-zinc-400 mt-1">
                                Upload a clear photo of yourself
                            </p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-8">
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <input
                                required
                                name="name"
                                type="text"
                                placeholder="e.g. Rahul Sharma"
                                className={inputClasses}
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClasses}>Age</label>
                                <input
                                    required
                                    name="age"
                                    type="number"
                                    placeholder="Enter age"
                                    className={inputClasses}
                                    value={formData.age}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Gender</label>
                                <div className="flex items-center gap-6 h-[60px] px-4">
                                    {["Male", "Female", "Other"].map((g) => (
                                        <label
                                            key={g}
                                            className="flex items-center gap-2 cursor-pointer group"
                                        >
                                            <input
                                                required
                                                type="radio"
                                                name="gender"
                                                className="w-5 h-5 accent-emerald-500 cursor-pointer"
                                                checked={formData.gender === g}
                                                onChange={() =>
                                                    handleGenderChange(g)
                                                }
                                            />
                                            <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors uppercase tracking-tight pt-1">
                                                {g}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Location</label>
                            <div className="relative">
                                <input
                                    required
                                    name="location"
                                    type="text"
                                    placeholder="Current City/Town"
                                    className={`${inputClasses} pr-12`}
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 text-xl opacity-50">
                                    🎯
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClasses}>
                                    Phone Number
                                </label>
                                <input
                                    required
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="+91 00000 00000"
                                    className={inputClasses}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>
                                    Email Address
                                </label>
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    placeholder="rahul@example.com"
                                    className={inputClasses}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Password</label>
                            <input
                                required
                                name="password"
                                type="password"
                                placeholder="Create a strong password"
                                className={inputClasses}
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Legal ID Section */}
                    <div>
                        <label className={labelClasses}>
                            Legal ID Verification
                        </label>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Front Side */}
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50/50 hover:bg-emerald-50/10 hover:border-emerald-500 transition-all cursor-pointer group overflow-hidden">
                                    {previews.idFront ? (
                                        <img
                                            src={previews.idFront}
                                            alt="ID Front"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                                                📄
                                            </span>
                                            <p className="text-xs font-black text-zinc-900">
                                                Front Side
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                                                Click to upload
                                            </p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        name="legalIdFront"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileChange(e, "legalIdFront")
                                        }
                                        required
                                    />
                                </label>
                            </div>
                            {/* Back Side */}
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50/50 hover:bg-emerald-50/10 hover:border-emerald-500 transition-all cursor-pointer group overflow-hidden">
                                    {previews.idBack ? (
                                        <img
                                            src={previews.idBack}
                                            alt="ID Back"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                                                📄
                                            </span>
                                            <p className="text-xs font-black text-zinc-900">
                                                Back Side
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                                                Click to upload
                                            </p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        name="legalIdBack"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileChange(e, "legalIdBack")
                                        }
                                        required
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
                    >
                        {isLoading ? (
                            <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                Submit & Continue
                                <span className="text-2xl group-hover:translate-x-2 transition-transform">
                                    →
                                </span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-12 flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-2">
                    🔒 Secure & Encrypted
                </span>
                <span className="flex items-center gap-2">
                    🛡️ KYC Verified Platform
                </span>
            </div>
        </div>
    );
}
