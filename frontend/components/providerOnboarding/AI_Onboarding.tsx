"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import {
    Camera,
    Upload,
    Mic,
    MicOff,
    ArrowRight,
    ArrowLeft,
    Check,
    RotateCcw,
    Loader2,
    Volume2,
    Square,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */

export interface AIOnboardingFormData {
    transcript: string;
    extractedFields: Record<string, unknown>;
    password: string;
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

type Phase =
    | "idle" // initial – nothing started
    | "greeting" // AI is speaking the greeting
    | "listening" // user is speaking
    | "analyzing" // LLM extraction in progress
    | "asking" // AI is asking a follow-up question (TTS playing)
    | "complete"; // all required fields collected

/* ── Component ──────────────────────────────────────────── */

export default function AI_Onboarding({
    onSubmit,
    onBack,
    onSwitchToManual,
    isLoading,
}: AI_OnboardingProps) {
    // Conversation state
    const [phase, setPhase] = useState<Phase>("idle");
    const [transcript, setTranscript] = useState("");
    const [aiMessage, setAiMessage] = useState("");
    const [extractedFields, setExtractedFields] = useState<
        Record<string, unknown>
    >({});
    const [missingFields, setMissingFields] = useState<string[]>([]);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioLevels, setAudioLevels] = useState<number[]>(
        new Array(9).fill(0),
    );

    // Image state
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [legalIdFront, setLegalIdFront] = useState<File | null>(null);
    const [legalIdBack, setLegalIdBack] = useState<File | null>(null);
    const [previews, setPreviews] = useState<{
        profile: string | null;
        front: string | null;
        back: string | null;
    }>({ profile: null, front: null, back: null });

    // Account fields
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [location, setLocation] = useState("");
    const [isReExtracting, setIsReExtracting] = useState(false);
    const isReExtractingRef = useRef(false);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );
    const isRecordingRef = useRef(false);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const phaseRef = useRef<Phase>("idle");
    const startMicRecordingRef = useRef<() => void>(() => {});

    const fileRefs = {
        profile: useRef<HTMLInputElement>(null),
        front: useRef<HTMLInputElement>(null),
        back: useRef<HTMLInputElement>(null),
    };

    // Keep phaseRef in sync
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    // Sync fields from LLM-extracted data
    useEffect(() => {
        if (
            extractedFields.gender &&
            typeof extractedFields.gender === "string" &&
            !gender
        ) {
            setGender(extractedFields.gender);
        }
        if (
            extractedFields.email &&
            typeof extractedFields.email === "string" &&
            !email
        ) {
            setEmail(extractedFields.email);
        }
        if (
            extractedFields.phone_number &&
            typeof extractedFields.phone_number === "string" &&
            !phoneNumber
        ) {
            setPhoneNumber(extractedFields.phone_number);
        }
        if (
            extractedFields.location &&
            typeof extractedFields.location === "string" &&
            !location
        ) {
            setLocation(extractedFields.location);
        }
        setIsReExtracting(false);
    }, [extractedFields]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupRecording();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Image handling ─────────────────────────────────── */

    const handleFileChange = (
        type: "profile" | "front" | "back",
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews((prev) => ({
                ...prev,
                [type]: reader.result as string,
            }));
        };
        reader.readAsDataURL(file);
        if (type === "profile") setProfilePicture(file);
        if (type === "front") setLegalIdFront(file);
        if (type === "back") setLegalIdBack(file);
    };

    /* ── Audio visualizer ───────────────────────────────── */

    const updateAudioLevels = useCallback(() => {
        if (!analyserRef.current || !isRecordingRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const bands = 9;
        const bandSize = Math.floor(dataArray.length / bands);
        const levels: number[] = [];
        for (let i = 0; i < bands; i++) {
            let sum = 0;
            for (let j = 0; j < bandSize; j++)
                sum += dataArray[i * bandSize + j];
            levels.push(sum / (bandSize * 255));
        }
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    }, []);

    /* ── TTS playback ───────────────────────────────────── */

    const stopTTS = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
            audioPlayerRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    const playTTS = useCallback((base64Mp3: string): Promise<void> => {
        return new Promise((resolve) => {
            const audio = new Audio(`data:audio/mp3;base64,${base64Mp3}`);
            audioPlayerRef.current = audio;
            setIsSpeaking(true);
            audio.onended = () => {
                audioPlayerRef.current = null;
                setIsSpeaking(false);
                resolve();
            };
            audio.onerror = () => {
                audioPlayerRef.current = null;
                setIsSpeaking(false);
                resolve();
            };
            audio.play().catch(() => {
                setIsSpeaking(false);
                resolve();
            });
        });
    }, []);

    /* ── WebSocket message handler ──────────────────────── */

    const handleWsMessage = useCallback(
        (event: MessageEvent) => {
            let data: Record<string, unknown>;
            try {
                data = JSON.parse(event.data as string);
            } catch {
                return;
            }

            switch (data.type) {
                case "greeting":
                    setAiMessage(data.text as string);
                    setPhase("greeting");
                    break;

                case "audio":
                    // Play TTS, then auto-resume recording
                    playTTS(data.data as string).then(() => {
                        const p = phaseRef.current;
                        if (p === "greeting" || p === "asking") {
                            startMicRecordingRef.current();
                        }
                    });
                    break;

                case "transcript":
                    setTranscript((prev) =>
                        prev
                            ? `${prev} ${(data.text as string).trim()}`
                            : (data.text as string).trim(),
                    );
                    setIsTranscribing(false);
                    break;

                case "analysis":
                    setExtractedFields(data.fields as Record<string, unknown>);
                    setMissingFields(data.missing as string[]);
                    if (isReExtractingRef.current) {
                        // Re-extraction: always go back to complete so transcript stays editable
                        setAiMessage("Fields updated from edited transcript.");
                        setPhase("complete");
                        isReExtractingRef.current = false;
                    } else if (data.question) {
                        setAiMessage(data.question as string);
                        setPhase("asking");
                    }
                    break;

                case "complete":
                    setExtractedFields(data.fields as Record<string, unknown>);
                    setMissingFields([]);
                    setAiMessage(
                        "All information collected. You can now upload your photos and complete setup.",
                    );
                    setPhase("complete");
                    isReExtractingRef.current = false;
                    break;

                case "error":
                    toast.error(data.message as string, { key: "ws-error" });
                    break;
            }
        },
        [playTTS],
    );

    /* ── WebSocket connect ──────────────────────────────── */

    const connectWebSocket = useCallback((): Promise<WebSocket> => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket("ws://127.0.0.1:8000/ws/transcribe/");
            ws.binaryType = "arraybuffer";
            ws.onopen = () => {
                wsRef.current = ws;
                resolve(ws);
            };
            ws.onmessage = handleWsMessage;
            ws.onerror = () => {
                toast.error("Connection to AI server failed.", {
                    key: "ws-error",
                });
                reject(new Error("WebSocket error"));
            };
            ws.onclose = () => {
                wsRef.current = null;
            };
        });
    }, [handleWsMessage]);

    /* ── Microphone recording ───────────────────────────── */

    const startMicRecording = useCallback(async () => {
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("Microphone access denied:", err);
            toast.error("Microphone access is required.", {
                key: "mic-required",
            });
            return;
        }

        mediaStreamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;

        isRecordingRef.current = true;
        updateAudioLevels();

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        // Helper: create a fresh recorder that produces a complete WebM on stop
        const createRecorder = () => {
            const rec = new MediaRecorder(stream, { mimeType });
            rec.ondataavailable = (e) => {
                if (
                    e.data.size > 500 &&
                    wsRef.current?.readyState === WebSocket.OPEN
                ) {
                    setIsTranscribing(true);
                    e.data
                        .arrayBuffer()
                        .then((buf) => wsRef.current?.send(buf));
                }
            };
            return rec;
        };

        // Start first recorder
        const recorder = createRecorder();
        recorder.start();
        mediaRecorderRef.current = recorder;

        // Every 3s: stop current recorder (triggers ondataavailable with
        // a complete, self-contained WebM file) then start a new one.
        chunkIntervalRef.current = setInterval(() => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop(); // fires ondataavailable
                const next = createRecorder();
                next.start();
                mediaRecorderRef.current = next;
            }
        }, 3000);

        setIsRecording(true);
        setPhase("listening");
    }, [updateAudioLevels]);

    // Keep the ref in sync so the WS handler always has the latest
    useEffect(() => {
        startMicRecordingRef.current = startMicRecording;
    }, [startMicRecording]);

    const cleanupRecording = useCallback(() => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setAudioLevels(new Array(9).fill(0));

        if (chunkIntervalRef.current) {
            clearInterval(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
        }
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    /* ── User actions ───────────────────────────────────── */

    /** Start button: connect WS + wait for greeting */
    const handleStart = async () => {
        try {
            await connectWebSocket();
        } catch {
            return;
        }
    };

    /** Stop recording + trigger analysis */
    const handleStopAndAnalyze = () => {
        cleanupRecording();
        setPhase("analyzing");
        // Tell backend to run LLM extraction
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: "analyze" }));
        }
    };

    /** Stop everything — kill TTS, stop recording, go back to listening-ready */
    const handleInterrupt = () => {
        stopTTS();
        cleanupRecording();
        // Stay in a "paused" state where transcript is kept but user can tap to resume
        setPhase("listening");
        setIsRecording(false);
    };

    /** Mic toggle */
    const toggleRecording = () => {
        if (phase === "idle") {
            handleStart();
        } else if (phase === "greeting" || phase === "asking") {
            // Interrupt TTS — user wants to stop the AI mid-speech
            handleInterrupt();
        } else if (phase === "analyzing") {
            // Let them cancel out of analyzing too
            handleInterrupt();
        } else if (isRecording) {
            handleStopAndAnalyze();
        } else if (phase === "complete") {
            // already done, do nothing
        } else {
            startMicRecording();
        }
    };

    /** Reset conversation */
    const handleReset = () => {
        cleanupRecording();
        setTranscript("");
        setAiMessage("");
        setExtractedFields({});
        setMissingFields([]);
        setPhase("idle");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: "reset" }));
            wsRef.current.close();
        }
        wsRef.current = null;
    };

    /** Send edited transcript to backend for re-extraction */
    const handleReExtract = () => {
        if (
            !transcript.trim() ||
            !wsRef.current ||
            wsRef.current.readyState !== WebSocket.OPEN
        )
            return;
        setIsReExtracting(true);
        isReExtractingRef.current = true;
        setPhase("analyzing");
        wsRef.current.send(
            JSON.stringify({ action: "re_analyze", transcript }),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Merge manual overrides into extracted fields
        const finalFields = { ...extractedFields };
        if (gender) finalFields.gender = gender;
        if (email) finalFields.email = email;
        if (phoneNumber) finalFields.phone_number = phoneNumber;
        if (location) finalFields.location = location;
        onSubmit({
            transcript,
            extractedFields: finalFields,
            password,
            profilePicture,
            legalIdFront,
            legalIdBack,
        });
    };

    /* ── Derived display values ─────────────────────────── */

    const skills = Array.isArray(extractedFields.skills)
        ? (extractedFields.skills as string[])
        : [];
    const fieldEntries = Object.entries(extractedFields).filter(
        ([k]) => k !== "skills" && extractedFields[k] != null,
    );

    const phaseLabel: Record<Phase, string> = {
        idle: "Ready to Start",
        greeting: isSpeaking ? "AI Speaking" : "Connecting...",
        listening: isRecording ? "Listening" : "Ready",
        analyzing: "Analyzing...",
        asking: isSpeaking ? "AI Speaking" : "Follow-up",
        complete: "Complete",
    };

    /* ── Render ─────────────────────────────────────────── */

    return (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Left Column: Images + Extracted Tags ────────── */}
            <div className="space-y-6">
                {/* Profile Photo */}
                <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6">
                        Profile Photo
                    </h3>
                    <div
                        onClick={() => fileRefs.profile.current?.click()}
                        className="aspect-square rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group relative overflow-hidden"
                    >
                        {previews.profile ? (
                            <img
                                src={previews.profile}
                                className="w-full h-full object-cover"
                                alt="Profile"
                            />
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-zinc-400" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400">
                                    Upload Photo
                                </span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileRefs.profile}
                            className="hidden"
                            onChange={(e) => handleFileChange("profile", e)}
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* ID Verification */}
                <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6">
                        ID Verification
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {(["front", "back"] as const).map((side) => (
                            <div
                                key={side}
                                onClick={() => fileRefs[side].current?.click()}
                                className="aspect-4/3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden"
                            >
                                {previews[side] ? (
                                    <img
                                        src={previews[side]!}
                                        className="w-full h-full object-cover"
                                        alt={`ID ${side}`}
                                    />
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                                        <span className="text-[10px] font-black uppercase text-zinc-400">
                                            {side} Side
                                        </span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileRefs[side]}
                                    className="hidden"
                                    onChange={(e) => handleFileChange(side, e)}
                                    accept="image/*"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extracted Tags */}
                {fieldEntries.length > 0 && (
                    <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                        <h3 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />{" "}
                            Extracted Profile
                        </h3>
                        <div className="space-y-3">
                            {fieldEntries.map(([key, val]) => (
                                <div
                                    key={key}
                                    className="flex items-start gap-2"
                                >
                                    <span className="text-[10px] font-black uppercase text-zinc-400 min-w-[70px] pt-0.5">
                                        {key.replace("_", " ")}
                                    </span>
                                    <span className="text-sm font-bold text-zinc-800">
                                        {String(val)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {skills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2">
                                    Skills
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-100"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {missingFields.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                <span className="text-[10px] font-black uppercase text-amber-500 block mb-2">
                                    Still needed
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {missingFields.map((f) => (
                                        <span
                                            key={f}
                                            className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full border border-amber-100"
                                        >
                                            {f.replace("_", " ")}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 font-bold text-sm px-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to choice
                </button>
            </div>

            {/* ── Right Column: AI Conversation ───────────────── */}
            <div className="relative">
                <div className="bg-white rounded-[40px] p-12 border border-zinc-100 shadow-xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent opacity-30" />

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-6">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                phase === "listening"
                                    ? "bg-emerald-500 animate-pulse"
                                    : phase === "analyzing"
                                      ? "bg-amber-500 animate-pulse"
                                      : phase === "complete"
                                        ? "bg-emerald-500"
                                        : "bg-emerald-300"
                            }`}
                        />
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                            {phaseLabel[phase]}
                        </span>
                    </div>

                    {/* AI Message Bubble */}
                    {aiMessage && (
                        <div className="w-full max-w-xl mb-6">
                            <div className="bg-emerald-50 rounded-3xl px-8 py-5 border border-emerald-100 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Volume2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                                        AI Assistant
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                                    {aiMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Idle state */}
                    {phase === "idle" && (
                        <>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">
                                AI Onboarding
                            </h2>
                            <p className="text-zinc-400 font-medium max-w-sm mb-8">
                                Tap the mic to start a conversation. The AI will
                                ask you about yourself and extract your profile
                                information automatically.
                            </p>
                        </>
                    )}

                    {/* Transcript Box */}
                    {phase !== "idle" && (
                        <div className="w-full max-w-xl relative mb-8">
                            <div className="bg-zinc-50 rounded-4xl p-8 border border-zinc-100 relative min-h-40 flex flex-col justify-center">
                                <span className="absolute left-6 top-6 text-4xl text-emerald-500/20 font-serif leading-none italic">
                                    &ldquo;
                                </span>
                                <textarea
                                    value={transcript}
                                    onChange={(e) =>
                                        setTranscript(e.target.value)
                                    }
                                    placeholder="Speak now — I'm listening..."
                                    className="w-full bg-white border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-700 leading-relaxed italic resize-y min-h-32 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all placeholder:text-zinc-400 placeholder:not-italic"
                                />
                                {isTranscribing && (
                                    <span className="text-zinc-400 text-xs mt-1">
                                        transcribing…
                                    </span>
                                )}
                                {isRecording && (
                                    <span className="inline-block w-1.5 h-5 bg-emerald-400 mt-2 animate-pulse rounded-full" />
                                )}
                                {transcript.trim() && !isRecording && (
                                    <button
                                        type="button"
                                        onClick={handleReExtract}
                                        disabled={isReExtracting}
                                        className="mt-3 px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wide transition-all disabled:opacity-50"
                                    >
                                        {isReExtracting
                                            ? "Re-extracting..."
                                            : "Re-extract from transcript"}
                                    </button>
                                )}
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-zinc-50 border-r border-b border-zinc-100 rotate-45" />
                        </div>
                    )}

                    {/* Analyzing spinner */}
                    {phase === "analyzing" && (
                        <div className="flex items-center gap-3 mb-8 text-amber-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-bold">
                                Analyzing your information...
                            </span>
                        </div>
                    )}

                    {/* Mic Button */}
                    <div className="relative mb-8">
                        <div
                            className={`absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 transition-all duration-500 ${
                                isRecording
                                    ? "scale-150"
                                    : "scale-0 group-hover:scale-110"
                            }`}
                        />
                        <button
                            onClick={toggleRecording}
                            disabled={phase === "complete"}
                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                                ${
                                    isRecording
                                        ? "bg-zinc-900 text-white scale-90"
                                        : isSpeaking ||
                                            phase === "greeting" ||
                                            phase === "asking"
                                          ? "bg-red-500 text-white hover:bg-red-600 hover:scale-110 shadow-red-400/30"
                                          : phase === "analyzing"
                                            ? "bg-amber-400 text-white hover:bg-amber-500 hover:scale-110 shadow-amber-400/30"
                                            : phase === "complete"
                                              ? "bg-emerald-400 text-black"
                                              : "bg-emerald-400 text-black hover:scale-110 shadow-emerald-400/30"
                                }`}
                        >
                            {phase === "analyzing" ? (
                                <Square className="w-6 h-6 fill-current" />
                            ) : phase === "complete" ? (
                                <Check className="w-8 h-8" />
                            ) : isSpeaking ||
                              phase === "greeting" ||
                              phase === "asking" ? (
                                <Square className="w-6 h-6 fill-current" />
                            ) : isRecording ? (
                                <MicOff className="w-8 h-8" />
                            ) : (
                                <Mic className="w-8 h-8" />
                            )}
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        <p
                            className={`text-sm font-black tracking-tight transition-colors ${
                                isRecording
                                    ? "text-emerald-500"
                                    : isSpeaking
                                      ? "text-red-500"
                                      : phase === "complete"
                                        ? "text-emerald-600"
                                        : "text-zinc-900"
                            }`}
                        >
                            {isRecording
                                ? "Listening... (tap to stop & analyze)"
                                : phase === "idle"
                                  ? "Tap to start conversation"
                                  : isSpeaking ||
                                      phase === "greeting" ||
                                      phase === "asking"
                                    ? "AI speaking — tap to interrupt"
                                    : phase === "analyzing"
                                      ? "Processing... (tap to cancel)"
                                      : phase === "complete"
                                        ? "Profile complete!"
                                        : "Tap to continue"}
                        </p>
                    </div>

                    {/* Waveform */}
                    <div className="flex items-center gap-1.5 h-8 mb-8">
                        {audioLevels.map((level, i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                    height: isRecording
                                        ? `${Math.max(15, level * 100)}%`
                                        : "15%",
                                    opacity: isRecording
                                        ? Math.max(0.3, level)
                                        : 0.2,
                                }}
                            />
                        ))}
                    </div>

                    {/* Account fields — always visible once conversation starts */}
                    {phase !== "idle" && (
                        <div className="w-full max-w-xl mb-8 space-y-4">
                            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                                    Account Setup
                                </h3>
                                {/* Gender selector */}
                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        Gender
                                    </label>
                                    <div className="flex gap-2">
                                        {["Male", "Female", "Other"].map(
                                            (g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() =>
                                                        setGender(
                                                            g.toLowerCase(),
                                                        )
                                                    }
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                                                        gender.toLowerCase() ===
                                                        g.toLowerCase()
                                                            ? "bg-emerald-400 text-black border-emerald-500 shadow-sm"
                                                            : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="your@email.com"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                    />
                                </div>
                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        placeholder="+91 98765 43210"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                    />
                                </div>
                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) =>
                                            setLocation(e.target.value)
                                        }
                                        placeholder="Mumbai, India"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                    />
                                </div>
                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        Set a Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Create a secure password"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="w-full pt-8 border-t border-zinc-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-3">
                            {phase !== "idle" && (
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" /> Reset
                                </button>
                            )}
                            <button
                                onClick={onSwitchToManual}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-3 rounded-2xl font-black text-sm transition-all"
                            >
                                Switch to Manual
                            </button>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={
                                isLoading || phase !== "complete" || !password
                            }
                            className={`px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-[0.98] shadow-lg
                                ${
                                    isLoading ||
                                    phase !== "complete" ||
                                    !password
                                        ? "bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none"
                                        : "bg-emerald-400 text-black hover:bg-emerald-500 shadow-emerald-400/20"
                                }`}
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
