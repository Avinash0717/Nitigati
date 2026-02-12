"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase,
    Tags,
    FileText,
    DollarSign,
    Upload,
    Image as ImageIcon,
    FileCheck,
    ChevronLeft,
    CheckCircle,
    Eye,
    Plus,
    X
} from "lucide-react";
import Link from "next/link";

interface ServiceFormPayload {
    service_title: string;
    service_description: string;
    tags: string;
    service_type: "remote" | "visit";
    price_min: number;
    price_max: number;
    service_images: File[];
    certifications?: File[];
}

export default function NewServiceFormPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<Omit<ServiceFormPayload, 'service_images' | 'certifications'>>({
        service_title: "",
        service_description: "",
        tags: "",
        service_type: "remote",
        price_min: 0,
        price_max: 0,
    });

    const [serviceImages, setServiceImages] = useState<File[]>([]);
    const [certifications, setCertifications] = useState<File[]>([]);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('price') ? parseFloat(value) || 0 : value
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'images' | 'certs') => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (type === 'images') {
                setServiceImages(prev => [...prev, ...newFiles]);
            } else {
                setCertifications(prev => [...prev, ...newFiles]);
            }
        }
    };

    const removeFile = (index: number, type: 'images' | 'certs') => {
        if (type === 'images') {
            setServiceImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setCertifications(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const submissionData = new FormData();
        submissionData.append("service_title", formData.service_title);
        submissionData.append("service_description", formData.service_description);
        submissionData.append("tags", formData.tags);
        submissionData.append("service_type", formData.service_type);
        submissionData.append("price_min", formData.price_min.toString());
        submissionData.append("price_max", formData.price_max.toString());

        serviceImages.forEach(file => {
            submissionData.append("service_images", file);
        });

        certifications.forEach(file => {
            submissionData.append("certifications", file);
        });

        try {
            const response = await fetch("/api/newServiceForm", {
                method: "POST",
                body: submissionData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "Failed to create service");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/providerDashboard");
            }, 2000);
        } catch (err: any) {
            console.error("Submission error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-zinc-100 text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Success!</h2>
                    <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                        Your service has been published successfully. Redirecting you to your dashboard...
                    </p>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafb] font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/providerDashboard" className="flex items-center gap-2 group text-zinc-400 hover:text-emerald-500 transition-colors">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-widest">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-lg italic">N</span>
                        </div>
                        <span className="text-xl font-black tracking-tighter">Nitigati</span>
                    </div>
                    <div className="w-20"></div> {/* Spacer for symmetry */}
                </div>
            </header>

            <main className="pt-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight mb-4">Create Service Listing</h1>
                        <p className="text-zinc-500 font-medium text-lg">Fill out the details below to showcase your professional service to potential clients.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Service Identity Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Briefcase size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Service Identity</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Service Title</label>
                                    <input
                                        type="text"
                                        name="service_title"
                                        required
                                        placeholder="e.g. Master Carpentry and Woodworking"
                                        value={formData.service_title}
                                        onChange={handleTextChange}
                                        className="w-full h-14 bg-zinc-50 rounded-2xl px-6 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-300"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Tags</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors">
                                            <Tags size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="tags"
                                            placeholder="Repair, Furniture, Interior (comma separated)"
                                            value={formData.tags}
                                            onChange={handleTextChange}
                                            className="w-full h-14 bg-zinc-50 rounded-2xl pl-14 pr-6 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <FileText size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Description</h2>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Full Service Overview</label>
                                <textarea
                                    name="service_description"
                                    required
                                    rows={6}
                                    placeholder="Describe what you offer in detail, your process, and why customers should choose you..."
                                    value={formData.service_description}
                                    onChange={handleTextChange}
                                    className="w-full bg-zinc-50 rounded-3xl p-6 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-300 resize-none"
                                />
                            </div>
                        </div>

                        {/* Logistics & Pricing Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <DollarSign size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Logistics & Pricing</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Service Type</label>
                                    <div className="flex gap-4">
                                        {(['remote', 'visit'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, service_type: type }))}
                                                className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest border-2 ${formData.service_type === type
                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                    : "bg-zinc-50 border-transparent text-zinc-400 hover:bg-zinc-100"
                                                    }`}
                                            >
                                                <span className="text-lg">{type === 'remote' ? '🏠' : '📍'}</span>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Price Range (USD)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300">$</div>
                                            <input
                                                type="number"
                                                name="price_min"
                                                required
                                                min="0"
                                                placeholder="Min"
                                                value={formData.price_min || ''}
                                                onChange={handleTextChange}
                                                className="w-full h-14 bg-zinc-50 rounded-2xl pl-10 pr-4 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all text-sm font-bold text-zinc-700 outline-none"
                                            />
                                        </div>
                                        <div className="text-zinc-300">—</div>
                                        <div className="flex-1 relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300">$</div>
                                            <input
                                                type="number"
                                                name="price_max"
                                                required
                                                min="0"
                                                placeholder="Max"
                                                value={formData.price_max || ''}
                                                onChange={handleTextChange}
                                                className="w-full h-14 bg-zinc-50 rounded-2xl pl-10 pr-4 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all text-sm font-bold text-zinc-700 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Media Upload Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <ImageIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Media</h2>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Service Images</label>
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    className="border-4 border-dashed border-zinc-50 rounded-[2rem] p-12 text-center hover:border-emerald-500/20 hover:bg-emerald-50/10 transition-all cursor-pointer group"
                                >
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'images')}
                                        className="hidden"
                                    />
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-500 shadow-sm">
                                        <Upload size={24} className="text-emerald-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <p className="text-lg font-black text-zinc-900 mb-2">Drop files here or click to upload</p>
                                    <p className="text-sm font-bold text-zinc-400">PNG, JPG or WEBP (Max 5MB each)</p>
                                </div>

                                {serviceImages.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        {serviceImages.map((file, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 group shadow-sm">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeFile(idx, 'images'); }}
                                                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Credentials Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <FileCheck size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Credentials <span className="text-zinc-300 ml-2 font-bold text-lg">(Optional)</span></h2>
                            </div>
                            <p className="text-zinc-400 font-medium mb-10 ml-16">Upload PDF or high-quality image of your licenses.</p>

                            <div className="space-y-6">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Certifications & Diplomas</label>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={() => certInputRef.current?.click()}
                                        className="h-14 bg-zinc-900 hover:bg-emerald-500 text-white px-8 rounded-2xl flex items-center gap-3 font-black text-xs transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
                                    >
                                        <Plus size={18} />
                                        <span>Add Certificate</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={certInputRef}
                                        multiple
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleFileChange(e, 'certs')}
                                        className="hidden"
                                    />
                                </div>

                                {certifications.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        {certifications.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                                        <FileCheck size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-600 truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx, 'certs')}
                                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            {error && (
                                <p className="text-red-500 text-sm font-black animate-bounce">⚠️ {error}</p>
                            )}
                            <div className="w-full flex flex-col md:flex-row gap-4 ml-auto">
                                <button
                                    type="button"
                                    className="px-10 h-16 rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3"
                                >
                                    <Eye size={18} />
                                    Preview
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-10 h-16 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Save & Publish
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Pro Tip Card */}
                    <div className="mt-20 bg-emerald-50/50 rounded-[2.5rem] p-10 border border-emerald-100 flex gap-6 relative overflow-hidden group">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                            <Plus size={24} />
                        </div>
                        <div className="flex-1 shrink-0">
                            <h4 className="text-lg font-black text-zinc-950 mb-2">Pro Tip</h4>
                            <p className="text-emerald-900/60 font-medium leading-relaxed max-w-lg">
                                Listings that include high-quality images and specific price ranges tend to get 45% more booking inquiries. Be sure to highlight your unique selling points in the description.
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    </div>

                    <footer className="mt-20 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 pb-20">
                        © 2024 Nitigati Marketplace. Empowering professional services worldwide.
                    </footer>
                </div>
            </main>
        </div>
    );
}
