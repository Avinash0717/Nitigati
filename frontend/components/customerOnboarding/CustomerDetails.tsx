'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CustomerFormData } from '@/app/customerOnboarding/page';
import { User, Camera, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface CustomerDetailsProps {
    onSubmit: (data: CustomerFormData) => void;
    isSubmitting: boolean;
    error: string | null;
}

export default function CustomerDetails({ onSubmit, isSubmitting, error }: CustomerDetailsProps) {
    const [formData, setFormData] = useState<Omit<CustomerFormData, 'profile_picture'>>({
        username: '',
        email: '',
        password: '',
        phone_number: '',
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            profile_picture: profilePicture,
        });
    };

    return (
        <div className="w-full max-w-[600px] bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative cursor-pointer"
                    >
                        <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all
              ${imagePreview ? 'border-[#00FF85]' : 'border-gray-200 bg-gray-50 group-hover:border-[#00FF85]'}`}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-gray-300" />
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#00FF85] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <Camera className="w-4 h-4 text-black" />
                        </div>
                    </div>
                    <span className="text-sm text-gray-500 mt-3 font-medium">Upload profile photo</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#1E293B]">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            placeholder="e.g. john_doe"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF85]/20 focus:border-[#00FF85] transition-all text-[#1E293B] placeholder:text-gray-300"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#1E293B]">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="example@domain.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF85]/20 focus:border-[#00FF85] transition-all text-[#1E293B] placeholder:text-gray-300"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#1E293B]">Phone Number</label>
                        <div className="flex gap-2">
                            <input
                                required
                                name="phone_number"
                                type="telephone"
                                placeholder="+91 00000 00000"
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF85]/20 focus:border-[#00FF85] transition-all text-[#1E293B] placeholder:text-gray-300"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#1E293B]">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF85]/20 focus:border-[#00FF85] transition-all text-[#1E293B] placeholder:text-gray-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
            ${isSubmitting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#00FF85] text-black hover:shadow-lg hover:shadow-[#00FF85]/20'}`}
                >
                    {isSubmitting ? 'Processing...' : 'Submit & Continue'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </button>

                <p className="text-center text-sm text-[#64748B]">
                    Already have an account? <span className="text-[#059669] font-bold cursor-pointer hover:underline"><Link href="/login">Log in</Link></span>
                </p>
            </form>
        </div>
    );
}
