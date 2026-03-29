"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSessionManager } from "@/components/Auth/SessionManager";

type Language = "en" | "hi";

export default function Home() {
    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState<Language>("en");
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef<HTMLDivElement | null>(null);

    const translations = {
        en: {
            navHowItWorks: "How it Works",
            navCategories: "Categories",
            authLogin: "Login",
            authJoin: "Join",
            authLogout: "Logout",
            authDashboard: "Dashboard",
            languageButton: "हिन्दी / EN",
            heroTitleLine1: "Find trusted local help",
            heroTitleLine2: "in your city",
            heroDesc:
                "Connecting you with skilled professionals for home, education, and lifestyle services.",
            searchPlaceholder: "Search for Carpentry, Tailoring, Tutoring...",
            searchButton: "Search",
            tryLabel: "Try:",
            quickTags: ["Electrician", "Plumbing", "Home Cleaning"],
            categorySectionTitle: "Popular Service Categories",
            viewAll: "View All",
            categories: [
                {
                    name: "Carpentry",
                    desc: "Furniture repair",
                    img: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=400&h=300&fit=crop",
                },
                {
                    name: "Tailoring",
                    desc: "Custom stitching",
                    img: "https://images.unsplash.com/photo-1552330614-3709dec866a1?w=400&h=300&fit=crop",
                },
                {
                    name: "Tutoring",
                    desc: "School subjects",
                    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
                },
                {
                    name: "Electrician",
                    desc: "Wiring & repair",
                    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
                },
                {
                    name: "Plumbing",
                    desc: "Pipes & leaks",
                    img: "https://images.unsplash.com/photo-1542013936693-884638332954?w=400&h=300&fit=crop",
                },
                {
                    name: "Cleaning",
                    desc: "Home & office",
                    img: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&h=300&fit=crop",
                },
            ],
            stepsSectionTitle: "Get work done in 5 simple steps",
            steps: [
                {
                    title: "1. Discover",
                    desc: "Find the right person for your specific job",
                },
                {
                    title: "2. Discuss",
                    desc: "Chat or call to explain what you need",
                },
                {
                    title: "3. Confirm",
                    desc: "Agree on time and price together",
                },
                {
                    title: "4. Work",
                    desc: "The service professional performs the job",
                },
                {
                    title: "5. Review",
                    desc: "Share your experience to help others",
                },
            ],
            customerCtaTitle: "Looking for services?",
            customerCtaDesc:
                "Join thousands of customers who find quality help daily.",
            customerCtaButton: "Get Started",
            providerCtaTitle: "Are you a Professional?",
            providerCtaDesc:
                "Grow your business by finding local jobs in your area.",
            providerCtaButton: "Register as Provider",
            footerDescription:
                "Empowering local communities through skilled work, transparency, and trust since 2024.",
            footerCompany: "Company",
            footerResources: "Resources",
            footerSupport: "Support",
            footerCompanyLinks: ["About Us", "Careers", "Contact"],
            footerResourceLinks: [
                "How It Works",
                "Provider Rules",
                "Safety Tips",
            ],
            footerSupportLinks: [
                "Help Center",
                "Terms of Service",
                "Privacy Policy",
            ],
            footerCopyright:
                "© 2024 Nitigati Platforms Pvt Ltd. Built with ❤️ for India.",
            footerLanguage: "Language: English",
            footerLocation: "Mumbai, India",
            languageMenuEnglish: "English",
            languageMenuHindi: "हिन्दी",
        },
        hi: {
            navHowItWorks: "कैसे काम करता है",
            navCategories: "श्रेणियां",
            authLogin: "लॉगिन",
            authJoin: "जॉइन करें",
            authLogout: "लॉगआउट",
            authDashboard: "डैशबोर्ड",
            languageButton: "हिन्दी / EN",
            heroTitleLine1: "अपने शहर में भरोसेमंद",
            heroTitleLine2: "लोकल मदद पाएँ",
            heroDesc:
                "घर, शिक्षा और लाइफस्टाइल सेवाओं के लिए कुशल प्रोफेशनल्स से जुड़ें।",
            searchPlaceholder:
                "कारपेंट्री, टेलरिंग, ट्यूशन जैसी सेवाएं खोजें...",
            searchButton: "खोजें",
            tryLabel: "आजमाएं:",
            quickTags: ["इलेक्ट्रीशियन", "प्लंबिंग", "होम क्लीनिंग"],
            categorySectionTitle: "लोकप्रिय सेवा श्रेणियां",
            viewAll: "सभी देखें",
            categories: [
                {
                    name: "कारपेंट्री",
                    desc: "फर्नीचर मरम्मत",
                    img: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=400&h=300&fit=crop",
                },
                {
                    name: "टेलरिंग",
                    desc: "कस्टम सिलाई",
                    img: "https://images.unsplash.com/photo-1552330614-3709dec866a1?w=400&h=300&fit=crop",
                },
                {
                    name: "ट्यूशन",
                    desc: "स्कूल विषय",
                    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
                },
                {
                    name: "इलेक्ट्रीशियन",
                    desc: "वायरिंग और मरम्मत",
                    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
                },
                {
                    name: "प्लंबिंग",
                    desc: "पाइप और लीकेज",
                    img: "https://images.unsplash.com/photo-1542013936693-884638332954?w=400&h=300&fit=crop",
                },
                {
                    name: "क्लीनिंग",
                    desc: "घर और ऑफिस",
                    img: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&h=300&fit=crop",
                },
            ],
            stepsSectionTitle: "5 आसान चरणों में काम पूरा करें",
            steps: [
                {
                    title: "1. खोजें",
                    desc: "अपने काम के लिए सही व्यक्ति चुनें",
                },
                {
                    title: "2. बात करें",
                    desc: "चैट या कॉल करके अपनी जरूरत बताएं",
                },
                {
                    title: "3. पक्का करें",
                    desc: "समय और कीमत मिलकर तय करें",
                },
                {
                    title: "4. काम",
                    desc: "सेवा प्रोफेशनल काम पूरा करता है",
                },
                {
                    title: "5. रिव्यू",
                    desc: "अपना अनुभव साझा करें",
                },
            ],
            customerCtaTitle: "सेवाएं चाहिए?",
            customerCtaDesc:
                "हजारों ग्राहकों के साथ जुड़ें जो रोज बेहतर सेवाएं पाते हैं।",
            customerCtaButton: "शुरू करें",
            providerCtaTitle: "क्या आप प्रोफेशनल हैं?",
            providerCtaDesc:
                "अपने क्षेत्र में लोकल काम पाकर अपना व्यवसाय बढ़ाएं।",
            providerCtaButton: "प्रोवाइडर के रूप में रजिस्टर करें",
            footerDescription:
                "2024 से स्थानीय समुदायों को कुशल काम, पारदर्शिता और भरोसे के साथ सशक्त बना रहे हैं।",
            footerCompany: "कंपनी",
            footerResources: "संसाधन",
            footerSupport: "सहायता",
            footerCompanyLinks: ["हमारे बारे में", "करियर", "संपर्क"],
            footerResourceLinks: [
                "कैसे काम करता है",
                "प्रोवाइडर नियम",
                "सुरक्षा सुझाव",
            ],
            footerSupportLinks: [
                "हेल्प सेंटर",
                "सेवा की शर्तें",
                "प्राइवेसी पॉलिसी",
            ],
            footerCopyright:
                "© 2024 नीतिगति प्लेटफॉर्म्स प्राइवेट लिमिटेड। भारत के लिए ❤️ के साथ निर्मित।",
            footerLanguage: "भाषा: हिन्दी",
            footerLocation: "मुंबई, भारत",
            languageMenuEnglish: "English",
            languageMenuHindi: "हिन्दी",
        },
    };

    const t = translations[language];
    const categories = t.categories;

    const session = useSessionManager();
    console.log("Session Token:", session.getToken());

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                languageMenuRef.current &&
                !languageMenuRef.current.contains(event.target as Node)
            ) {
                setIsLanguageMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsLanguageMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const languageSelector = (
        <div className="relative hidden sm:block" ref={languageMenuRef}>
            <button
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm font-bold hover:bg-zinc-50 transition-colors"
                aria-haspopup="menu"
                aria-expanded={isLanguageMenuOpen}
                aria-label="Select page language"
            >
                <span className="text-lg">🌐</span>
                <span className="tracking-tight">{t.languageButton}</span>
            </button>

            {isLanguageMenuOpen ? (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl py-1 z-50">
                    <button
                        onClick={() => {
                            setLanguage("en");
                            setIsLanguageMenuOpen(false);
                            localStorage.setItem("preferredLanguage", "en");
                        }}
                        className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            language === "en"
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                    >
                        {t.languageMenuEnglish}
                    </button>
                    <button
                        onClick={() => {
                            setLanguage("hi");
                            setIsLanguageMenuOpen(false);
                            localStorage.setItem("preferredLanguage", "hi");
                        }}
                        className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            language === "hi"
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                    >
                        {t.languageMenuHindi}
                    </button>
                </div>
            ) : null}
        </div>
    );

    const steps = [
        {
            icon: (
                <svg
                    className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            ),
        },
        {
            icon: (
                <svg
                    className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                </svg>
            ),
        },
        {
            icon: (
                <svg
                    className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            icon: (
                <svg
                    className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 11-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                </svg>
            ),
        },
        {
            icon: (
                <svg
                    className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                            <span className="text-white font-black text-xl italic pt-1">
                                N
                            </span>
                        </div>
                        <span className="text-2xl font-black tracking-tight pt-1">
                            Nitigati
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-10">
                        <Link
                            href="#"
                            className="text-zinc-600 hover:text-emerald-500 transition-colors font-semibold"
                        >
                            {t.navHowItWorks}
                        </Link>
                        <Link
                            href="#"
                            className="text-zinc-600 hover:text-emerald-500 transition-colors font-semibold"
                        >
                            {t.navCategories}
                        </Link>
                    </div>

                    {session.getToken() == null ? (
                        <div className="flex items-center gap-4">
                            {languageSelector}

                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-bold hover:text-emerald-500 transition-colors"
                            >
                                {t.authLogin}
                            </Link>
                            <Link
                                href="/#Onboarding"
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                {t.authJoin}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            {languageSelector}

                            <Link
                                href="/logout"
                                className="px-4 py-2 text-sm font-bold hover:text-emerald-500 transition-colors"
                            >
                                {t.authLogout}
                            </Link>
                            <Link
                                href="/customerDashboard"
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                {t.authDashboard}
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative py-24 lg:py-32 overflow-hidden bg-white">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-zinc-900">
                            {t.heroTitleLine1}
                            <br />
                            {t.heroTitleLine2}
                        </h1>
                        <p className="text-lg lg:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            {t.heroDesc}
                        </p>

                        <div className="max-w-2xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-linear-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-100 p-2 flex items-center">
                                <div className="flex-1 flex items-center px-4">
                                    <span className="text-xl grayscale opacity-50">
                                        🔍
                                    </span>
                                    <input
                                        type="text"
                                        placeholder={t.searchPlaceholder}
                                        className="w-full px-4 py-3 outline-none text-zinc-700 font-bold placeholder:text-zinc-300 placeholder:font-medium"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </div>
                                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                                    {t.searchButton}
                                </button>
                            </div>
                        </div>

                        <div className="mt-10 flex items-center justify-center flex-wrap gap-4 text-sm font-bold">
                            <span className="text-zinc-400">{t.tryLabel}</span>
                            {t.quickTags.map((tag) => (
                                <button
                                    key={tag}
                                    className="text-zinc-800 border-b-2 border-zinc-100 hover:border-emerald-500 transition-all px-1 pb-0.5"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-24 bg-zinc-50/50 border-y border-zinc-100">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-16">
                            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-zinc-900">
                                {t.categorySectionTitle}
                            </h2>
                            <Link
                                href="#"
                                className="flex items-center gap-2 text-emerald-600 font-black hover:gap-3 transition-all group"
                            >
                                <span>{t.viewAll}</span>
                                <span className="text-xl">→</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {categories.map((cat, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-white rounded-3xl border border-zinc-100 p-3 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all hover:-translate-y-2 cursor-pointer"
                                >
                                    <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-5 bg-zinc-100">
                                        <img
                                            src={cat.img}
                                            alt={cat.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/10 transition-colors"></div>
                                    </div>
                                    <div className="px-2 pb-3 text-center">
                                        <h3 className="font-black text-zinc-900 text-lg mb-1">
                                            {cat.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                                            {cat.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Steps Section */}
                <section className="py-32 max-w-7xl mx-auto px-4">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl font-black tracking-tight text-zinc-900 mb-4">
                            {t.stepsSectionTitle}
                        </h2>
                        <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="relative">
                        {/* Desktop Connector Line */}
                        <div className="absolute top-12 left-[10%] right-[10%] h-1 bg-zinc-100 hidden lg:block rounded-full overflow-hidden">
                            <div className="w-1/4 h-full bg-emerald-500/20"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-16 lg:gap-8 relative z-10">
                            {steps.map((step, idx) => (
                                <div key={idx} className="text-center group">
                                    <div className="w-24 h-24 bg-emerald-50 rounded-4xl flex items-center justify-center mx-auto mb-8 group-hover:bg-emerald-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm">
                                        {step.icon}
                                    </div>
                                    <h3 className="font-black text-xl mb-3 text-zinc-900">
                                        {t.steps[idx].title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-50 mx-auto">
                                        {t.steps[idx].desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section
                    className="py-24 max-w-7xl mx-auto px-4"
                    id="Onboarding"
                >
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="bg-emerald-50 rounded-[3rem] p-12 lg:p-20 border border-emerald-1 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black mb-6 text-emerald-950">
                                    {t.customerCtaTitle}
                                </h2>
                                <p className="text-emerald-900/50 mb-12 font-bold text-lg max-w-xs">
                                    {t.customerCtaDesc}
                                </p>
                                {/* <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
                  Get Started
                </button> */}
                                <Link
                                    href="/customerOnboarding"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95"
                                >
                                    {t.customerCtaButton}
                                </Link>
                            </div>
                            <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                        </div>

                        <div className="bg-zinc-900 text-white rounded-[3rem] p-12 lg:p-20 relative overflow-hidden group border border-zinc-800">
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black mb-6">
                                    {t.providerCtaTitle}
                                </h2>
                                <p className="text-zinc-500 mb-12 font-bold text-lg max-w-xs">
                                    {t.providerCtaDesc}
                                </p>
                                <Link
                                    href="/providerOnboarding"
                                    className="inline-block bg-white hover:bg-zinc-100 text-zinc-950 px-12 py-5 rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-white/5"
                                >
                                    {t.providerCtaButton}
                                </Link>
                            </div>
                            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-700"></div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-50 border-t border-zinc-200 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
                        <div className="lg:col-span-2">
                            <Link
                                href="/"
                                className="flex items-center gap-2 mb-8 group"
                            >
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-black text-xl italic pt-0.5">
                                        N
                                    </span>
                                </div>
                                <span className="text-2xl font-black tracking-tight pt-0.5">
                                    Nitigati
                                </span>
                            </Link>
                            <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-10 max-w-sm">
                                {t.footerDescription}
                            </p>
                            <div className="flex gap-6">
                                <Link
                                    href="#"
                                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 hover:border-emerald-500 transition-all"
                                >
                                    <span className="text-2xl">📸</span>
                                </Link>
                                <Link
                                    href="#"
                                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 hover:border-emerald-500 transition-all"
                                >
                                    <span className="text-2xl">🐦</span>
                                </Link>
                                <Link
                                    href="#"
                                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 hover:border-emerald-500 transition-all"
                                >
                                    <span className="text-2xl">🎥</span>
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-black text-zinc-900 mb-8 uppercase tracking-widest text-xs">
                                {t.footerCompany}
                            </h4>
                            <ul className="space-y-5 text-zinc-500 font-bold">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerCompanyLinks[0]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerCompanyLinks[1]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerCompanyLinks[2]}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-zinc-900 mb-8 uppercase tracking-widest text-xs">
                                {t.footerResources}
                            </h4>
                            <ul className="space-y-5 text-zinc-500 font-bold">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerResourceLinks[0]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerResourceLinks[1]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerResourceLinks[2]}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-zinc-900 mb-8 uppercase tracking-widest text-xs">
                                {t.footerSupport}
                            </h4>
                            <ul className="space-y-5 text-zinc-500 font-bold">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerSupportLinks[0]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerSupportLinks[1]}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        {t.footerSupportLinks[2]}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] uppercase tracking-[0.2em] font-black text-zinc-400">
                        <p>{t.footerCopyright}</p>
                        <div className="flex items-center gap-10">
                            <span className="flex items-center gap-3">
                                <span className="text-emerald-500">🌏</span>{" "}
                                {t.footerLanguage}
                            </span>
                            <span className="flex items-center gap-3">
                                <span className="text-emerald-500">📍</span>{" "}
                                {t.footerLocation}
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
