"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import type { OnboardingFormData } from "@/app/providerOnboarding/page";
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
    Pencil,
} from "lucide-react";

/* ── Localisation ─────────────────────────────────────────────────────────
   Every user-visible string lives here. Swap values (or the whole object)
   to localise without touching any logic.                                  */
const S = {
    title: "AI Onboarding",
    subtitle: "Tap the mic and talk naturally — any language works.",
    phase_idle: "Ready",
    phase_greeting: "AI Speaking",
    phase_connecting: "Connecting…",
    phase_listening: "Listening",
    phase_ready: "Ready",
    phase_analyzing: "Analyzing…",
    phase_asking_speaking: "AI Speaking",
    phase_asking: "Follow-up",
    phase_complete: "Complete",
    mic_start: "Tap to start conversation",
    mic_listening: "Listening… (tap to stop)",
    mic_ai: "AI speaking — tap to interrupt",
    mic_processing: "Processing… (tap to cancel)",
    mic_complete: "Profile complete!",
    mic_continue: "Tap to continue",
    transcript_ph: "Speak now — I'm listening…",
    re_extract: "Re-extract from transcript",
    re_extracting: "Re-extracting…",
    ai_label: "AI Assistant",
    ai_greeting:
        "Hello! Tell me your name, what you do, your skills, and where you're based. Any language is fine.",
    ai_complete:
        "Got everything! Review below, correct anything wrong, then complete setup.",
    ai_updated: "Fields updated from transcript.",
    s_photo: "Profile Photo",
    s_id: "ID Verification",
    s_extracted: "Extracted Profile",
    s_skills: "Skills",
    s_needed: "Still needed",
    s_account: "Account Setup",
    f_name: "Full Name",
    f_gender: "Gender",
    f_male: "Male",
    f_female: "Female",
    f_other: "Other",
    f_email: "Email",
    f_phone: "Phone",
    f_location: "Location",
    f_skills: "Skills (comma-separated)",
    f_password: "Password",
    ph_name: "Your full name",
    ph_email: "you@example.com",
    ph_phone: "+1 555 000 0000",
    ph_location: "City, Country",
    ph_skills: "React, Design, Python…",
    ph_password: "Create a secure password",
    ph_photo: "Upload Photo",
    ph_front: "Front",
    ph_back: "Back",
    btn_back: "Back",
    btn_reset: "Reset",
    btn_manual: "Switch to Manual",
    btn_submit: "Complete Setup",
    btn_processing: "Processing…",
    err_mic: "Microphone access is required.",
    err_key: "NEXT_PUBLIC_GEMINI_API_KEY is not set.",
    err_gemini: "Gemini connection failed — check console.",
};

/* ── Types ────────────────────────────────────────────────────────────── */
export interface AIOnboardingFormData {
    transcript: string;
    extractedFields: Record<string, unknown>;
    password: string;
    profilePicture: File | null;
    legalIdFront: File | null;
    legalIdBack: File | null;
}

interface Props {
    onSubmit: (data: AIOnboardingFormData) => void;
    onBack: () => void;
    onSwitchToManual: () => void;
    isLoading: boolean;
    initialData?: Partial<OnboardingFormData>;
    onDataChange?: (data: Partial<OnboardingFormData>) => void;
}

type Phase =
    | "idle"
    | "greeting"
    | "listening"
    | "analyzing"
    | "asking"
    | "complete";

/* ── Gemini Live session ──────────────────────────────────────────────────
   Uses official @google/genai live APIs instead of manually constructing
   websocket URLs and protocol payloads.

   Backend is still only used on final submit. */
class GeminiLiveSession {
    private session: {
        sendRealtimeInput: (params: unknown) => void;
        sendClientContent: (params: unknown) => void;
        close: () => void;
    } | null = null;
    private readonly model = this.resolveModel();
    private connected = false;

    onText: (t: string) => void = () => {};
    onAudio: (b64: string) => void = () => {};
    onTurnComplete: () => void = () => {};
    onError: (msg: string) => void = () => {};

    constructor(private apiKey: string) {}

    private resolveModel(): string {
        const requested =
            process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ||
            "models/gemini-3.1-flash-live-preview";

        if (/gemini-2(\.|-)/i.test(requested)) {
            throw new Error(
                "Unsupported model configured: Gemini 2 live models are disabled. Use Gemini 3.1 Flash Live.",
            );
        }

        if (!/gemini-3\.1.*live/i.test(requested)) {
            throw new Error(
                "Unsupported live model configured. Use Gemini 3.1 Flash Live.",
            );
        }

        return requested;
    }

    async connect(): Promise<void> {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        let session: {
            sendRealtimeInput: (params: unknown) => void;
            sendClientContent: (params: unknown) => void;
            close: () => void;
        };

        try {
            session = (await Promise.race([
                ai.live.connect({
                    model: this.model,
                    config: {
                        responseModalities: [Modality.TEXT, Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: "Aoede" },
                            },
                        },
                        systemInstruction: {
                            parts: [
                                {
                                    text: `You are a friendly multilingual onboarding assistant.
Respond in the SAME language the user uses.
Collect: full name, email, phone, city/location, gender, professional skills.
Ask naturally — one or two things at a time. Be warm and brief.
End your final message with the exact word EXTRACTION_DONE.`,
                                },
                            ],
                        },
                    },
                    callbacks: {
                        onopen: () => {
                            this.connected = true;
                        },
                        onmessage: (msg: unknown) => {
                            const liveMsg = msg as {
                                error?: { message?: string; code?: number };
                                text?: string;
                                data?: string;
                                serverContent?: { turnComplete?: boolean };
                            };

                            const err = liveMsg?.error;
                            if (err) {
                                const message =
                                    err.message ||
                                    `Gemini setup failed${err.code ? ` (code ${err.code})` : ""}.`;
                                this.onError(message);
                                return;
                            }

                            if (
                                typeof liveMsg?.text === "string" &&
                                liveMsg.text.trim()
                            ) {
                                this.onText(liveMsg.text);
                            }

                            if (
                                typeof liveMsg?.data === "string" &&
                                liveMsg.data
                            ) {
                                this.onAudio(liveMsg.data);
                            }

                            if (liveMsg?.serverContent?.turnComplete) {
                                this.onTurnComplete();
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            const message =
                                e?.error?.message ||
                                e?.message ||
                                `${S.err_gemini} (SDK live error)`;
                            this.onError(message);
                        },
                        onclose: (e: CloseEvent) => {
                            if (!this.connected) {
                                this.onError(
                                    `Live session closed before ready. code=${e.code} reason=${e.reason || "(none)"}`,
                                );
                            }
                            this.connected = false;
                        },
                    },
                }),
                new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(
                            new Error(
                                `Gemini setup timed out (30 s). model=${this.model}`,
                            ),
                        );
                    }, 30_000);
                }),
            ])) as typeof session;
        } catch (err) {
            this.close();
            throw err instanceof Error ? err : new Error(String(err));
        }

        this.session = session;
        this.connected = true;
    }

    sendAudio(b64: string) {
        this.session?.sendRealtimeInput({
            audio: {
                mimeType: "audio/pcm;rate=16000",
                data: b64,
            },
        });
    }

    sendText(text: string) {
        this.session?.sendClientContent({
            turns: [{ role: "user", parts: [{ text }] }],
            turnComplete: true,
        });
    }

    close() {
        this.connected = false;
        this.session?.close();
        this.session = null;
    }
}

/* ── Audio pipeline hook ─────────────────────────────────────────────── */
function useAudioPipeline(onChunk: (b64: string) => void) {
    const r = useRef({
        stream: null as MediaStream | null,
        ctx: null as AudioContext | null,
        proc: null as ScriptProcessorNode | null,
        raf: null as number | null,
        analyser: null as AnalyserNode | null,
        active: false,
        audioEl: null as HTMLAudioElement | null,
    });

    const [levels, setLevels] = useState<number[]>(new Array(9).fill(0));
    const [recording, setRecording] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    // Stable ref so useCallback deps stay empty
    const onChunkRef = useRef(onChunk);
    useEffect(() => {
        onChunkRef.current = onChunk;
    }, [onChunk]);

    const tickRef = useRef<() => void>(() => {});

    const tick = useCallback(() => {
        if (!r.current.analyser || !r.current.active) return;
        const data = new Uint8Array(r.current.analyser.frequencyBinCount);
        r.current.analyser.getByteFrequencyData(data);
        const sz = Math.floor(data.length / 9);
        setLevels(
            Array.from({ length: 9 }, (_, i) => {
                let s = 0;
                for (let j = 0; j < sz; j++) s += data[i * sz + j];
                return s / (sz * 255);
            }),
        );
        r.current.raf = requestAnimationFrame(() => tickRef.current());
    }, []); // reads only refs — intentionally stable

    useEffect(() => {
        tickRef.current = tick;
    }, [tick]);

    const start = useCallback(async () => {
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            alert(S.err_mic);
            return;
        }

        r.current.stream = stream;
        const ctx = new AudioContext({ sampleRate: 16000 });
        r.current.ctx = ctx;
        if (ctx.state === "suspended") await ctx.resume();

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        r.current.analyser = analyser;

        const proc = ctx.createScriptProcessor(4096, 1, 1);
        proc.onaudioprocess = (e) => {
            if (!r.current.active) return;
            const f32 = e.inputBuffer.getChannelData(0);
            const i16 = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; i++)
                i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
            const bytes = new Uint8Array(i16.buffer);
            let bin = "";
            bytes.forEach((b) => (bin += String.fromCharCode(b)));
            onChunkRef.current(btoa(bin));
        };
        src.connect(proc);
        proc.connect(ctx.destination);
        r.current.proc = proc;
        r.current.active = true;
        setRecording(true);
        tick();
    }, [tick]);

    const stop = useCallback(() => {
        r.current.active = false;
        setRecording(false);
        setLevels(new Array(9).fill(0));
        if (r.current.raf) {
            cancelAnimationFrame(r.current.raf);
            r.current.raf = null;
        }
        r.current.proc?.disconnect();
        r.current.proc = null;
        r.current.stream?.getTracks().forEach((t) => t.stop());
        r.current.stream = null;
        if (r.current.ctx?.state !== "closed") r.current.ctx?.close();
        r.current.ctx = null;
    }, []);

    const playTTS = useCallback((b64pcm: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!r.current.audioEl) r.current.audioEl = new Audio();
            const audio = r.current.audioEl;
            audio.pause();

            // Wrap raw 24 kHz PCM in a WAV header so browsers can play it
            const pcm = Uint8Array.from(atob(b64pcm), (c) => c.charCodeAt(0));
            const hdr = new ArrayBuffer(44);
            const v = new DataView(hdr);
            const str = (o: number, s: string) =>
                [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
            const SR = 24000,
                CH = 1,
                BPS = 16;
            str(0, "RIFF");
            v.setUint32(4, 36 + pcm.byteLength, true);
            str(8, "WAVE");
            str(12, "fmt ");
            v.setUint32(16, 16, true);
            v.setUint16(20, 1, true);
            v.setUint16(22, CH, true);
            v.setUint32(24, SR, true);
            v.setUint32(28, (SR * CH * BPS) / 8, true);
            v.setUint16(32, (CH * BPS) / 8, true);
            v.setUint16(34, BPS, true);
            str(36, "data");
            v.setUint32(40, pcm.byteLength, true);
            audio.src = URL.createObjectURL(
                new Blob([hdr, pcm], { type: "audio/wav" }),
            );

            setSpeaking(true);
            const done = () => {
                setSpeaking(false);
                resolve();
            };
            audio.onended = done;
            audio.onerror = done;
            audio.play().catch(done);
        });
    }, []);

    const stopTTS = useCallback(() => {
        if (r.current.audioEl) {
            r.current.audioEl.pause();
            r.current.audioEl.currentTime = 0;
        }
        setSpeaking(false);
    }, []);

    useEffect(
        () => () => {
            stop();
            stopTTS();
        },
        [stop, stopTTS],
    );

    return { start, stop, playTTS, stopTTS, levels, recording, speaking };
}

/* ── Voice session hook ──────────────────────────────────────────────── */
interface SessionState {
    phase: Phase;
    transcript: string;
    aiMessage: string;
    fields: Record<string, unknown>;
    missing: string[];
}

function useVoiceSession(
    playTTS: (b64: string) => Promise<void>,
    stopTTS: () => void,
    startMic: () => Promise<void>,
    stopMic: () => void,
) {
    const gem = useRef<GeminiLiveSession | null>(null);
    const phaseRef = useRef<Phase>("idle");
    const queue = useRef<string[]>([]);
    const playing = useRef(false);
    const connecting = useRef(false);

    const [st, setSt] = useState<SessionState>({
        phase: "idle",
        transcript: "",
        aiMessage: "",
        fields: {},
        missing: [],
    });

    const setPhase = useCallback((p: Phase) => {
        phaseRef.current = p;
        setSt((s) => ({ ...s, phase: p }));
    }, []);

    // Regex-based field extraction — runs client-side, no backend needed mid-session
    const extract = useCallback((t: string): Record<string, unknown> => {
        const lo = t.toLowerCase();
        const out: Record<string, unknown> = {};
        const email = t.match(
            /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
        );
        if (email) out.email = email[0];
        const phone = t.match(/(?:\+?\d[\d\s\-().]{7,}\d)/);
        if (phone) out.phone_number = phone[0].trim();
        if (/\b(male|man|boy|he\/him)\b/.test(lo)) out.gender = "male";
        else if (/\b(female|woman|girl|she\/her)\b/.test(lo))
            out.gender = "female";
        const name = t.match(
            /(?:my name is|i(?:'m| am)|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        );
        if (name) out.name = name[1];
        const loc = t.match(
            /(?:based in|from|living in|located in|i live in|i'm in)\s+([A-Za-z\s,]+?)(?:[.,]|$)/i,
        );
        if (loc) out.location = loc[1].trim();
        return out;
    }, []);

    const drainAudio = useCallback(async () => {
        if (playing.current) return;
        playing.current = true;
        while (queue.current.length) await playTTS(queue.current.shift()!);
        playing.current = false;
        if (phaseRef.current === "greeting" || phaseRef.current === "asking") {
            setPhase("listening");
            await startMic();
        }
    }, [playTTS, startMic, setPhase]);

    const connect = useCallback(async () => {
        if (connecting.current || gem.current || phaseRef.current !== "idle")
            return;
        connecting.current = true;

        const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!key) {
            alert(S.err_key);
            connecting.current = false;
            return;
        }

        let session: GeminiLiveSession;
        try {
            session = new GeminiLiveSession(key);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : String(err);
            alert(message);
            connecting.current = false;
            return;
        }
        gem.current = session;

        session.onText = (text) =>
            setSt((s) => {
                const tr = s.transcript
                    ? `${s.transcript} ${text.trim()}`
                    : text.trim();
                const msg = text.replace("EXTRACTION_DONE", "").trim();
                const done = text.includes("EXTRACTION_DONE");
                if (done) phaseRef.current = "complete";
                return {
                    ...s,
                    phase: done ? "complete" : s.phase,
                    transcript: tr,
                    aiMessage: msg || (done ? S.ai_complete : s.aiMessage),
                    fields: extract(tr),
                    missing: done ? [] : s.missing,
                };
            });

        session.onAudio = (b64) => {
            queue.current.push(b64);
            drainAudio();
        };
        session.onError = (msg) => {
            alert(msg);
            setPhase("idle");
        };

        try {
            await session.connect();
        } catch (err) {
            console.error("Gemini connection error:", err);
            alert(
                `${S.err_gemini}\n${err instanceof Error ? err.message : err}`,
            );
            gem.current = null;
            connecting.current = false;
            return;
        }

        connecting.current = false;
        setPhase("greeting");
        setSt((s) => ({ ...s, aiMessage: S.ai_greeting }));
        session.sendText(
            "Greet the user warmly and ask them to tell you about themselves. 2 sentences max.",
        );
    }, [drainAudio, extract, setPhase]);

    const disconnect = useCallback(() => {
        gem.current?.close();
        gem.current = null;
        connecting.current = false;
    }, []);

    const stopAndAnalyze = useCallback(() => {
        stopMic();
        setPhase("asking");
        gem.current?.sendText(
            "[User finished speaking. Ask for anything still missing, or say EXTRACTION_DONE if complete.]",
        );
    }, [stopMic, setPhase]);

    const interrupt = useCallback(() => {
        stopTTS();
        stopMic();
        queue.current = [];
        playing.current = false;
        setPhase("listening");
    }, [stopTTS, stopMic, setPhase]);

    const reset = useCallback(() => {
        stopTTS();
        stopMic();
        queue.current = [];
        playing.current = false;
        disconnect();
        setSt({
            phase: "idle",
            transcript: "",
            aiMessage: "",
            fields: {},
            missing: [],
        });
    }, [stopTTS, stopMic, disconnect]);

    const reExtract = useCallback(
        (transcript: string) => {
            const fields = extract(transcript);
            setSt((s) => ({
                ...s,
                fields: { ...s.fields, ...fields },
                aiMessage: S.ai_updated,
                phase: "complete",
            }));
            phaseRef.current = "complete";
        },
        [extract],
    );

    const setTranscript = useCallback(
        (t: string) => setSt((s) => ({ ...s, transcript: t })),
        [],
    );

    useEffect(
        () => () => {
            disconnect();
        },
        [disconnect],
    );

    return {
        st,
        setTranscript,
        connect,
        disconnect,
        sendAudioChunk: (b64: string) => gem.current?.sendAudio(b64),
        stopAndAnalyze,
        interrupt,
        reset,
        reExtract,
    };
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function AI_Onboarding({
    onSubmit,
    onBack,
    onSwitchToManual,
    isLoading,
    initialData,
    onDataChange,
}: Props) {
    const [profilePicture, setProfilePicture] = useState<File | null>(
        initialData?.profilePicture ?? null,
    );
    const [legalIdFront, setLegalIdFront] = useState<File | null>(
        initialData?.legalIdFront ?? null,
    );
    const [legalIdBack, setLegalIdBack] = useState<File | null>(
        initialData?.legalIdBack ?? null,
    );
    const [previews, setPreviews] = useState<{
        profile: string | null;
        front: string | null;
        back: string | null;
    }>(() => ({
        profile: initialData?.profilePicture
            ? URL.createObjectURL(initialData.profilePicture)
            : null,
        front: initialData?.legalIdFront
            ? URL.createObjectURL(initialData.legalIdFront)
            : null,
        back: initialData?.legalIdBack
            ? URL.createObjectURL(initialData.legalIdBack)
            : null,
    }));

    const [name, setName] = useState(initialData?.name ?? "");
    const [password, setPassword] = useState(initialData?.password ?? "");
    const [gender, setGender] = useState(initialData?.gender ?? "");
    const [email, setEmail] = useState(initialData?.email ?? "");
    const [phone, setPhone] = useState(initialData?.phoneNumber ?? "");
    const [location, setLocation] = useState(initialData?.location ?? "");
    const [skills, setSkills] = useState("");
    const [reExtracting, setReExtracting] = useState(false);

    const profileFileRef = useRef<HTMLInputElement>(null);
    const frontFileRef = useRef<HTMLInputElement>(null);
    const backFileRef = useRef<HTMLInputElement>(null);

    const openPicker = useCallback((type: "profile" | "front" | "back") => {
        if (type === "profile") {
            profileFileRef.current?.click();
            return;
        }
        if (type === "front") {
            frontFileRef.current?.click();
            return;
        }
        backFileRef.current?.click();
    }, []);

    useEffect(() => {
        onDataChange?.({
            name,
            password,
            gender,
            email,
            phoneNumber: phone,
            location,
            profilePicture,
            legalIdFront,
            legalIdBack,
        });
    }, [
        onDataChange,
        name,
        password,
        gender,
        email,
        phone,
        location,
        profilePicture,
        legalIdFront,
        legalIdBack,
    ]);

    const sendRef = useRef<(b64: string) => void>(() => {});
    const { start, stop, playTTS, stopTTS, levels, recording, speaking } =
        useAudioPipeline(useCallback((b64) => sendRef.current(b64), []));

    const {
        st,
        setTranscript,
        connect,
        sendAudioChunk,
        stopAndAnalyze,
        interrupt,
        reset,
        reExtract,
    } = useVoiceSession(playTTS, stopTTS, start, stop);

    const {
        phase,
        transcript,
        aiMessage,
        fields: extractedFields,
        missing: missingFields,
    } = st;

    const extractedName =
        typeof extractedFields.name === "string" ? extractedFields.name : "";
    const extractedGender =
        typeof extractedFields.gender === "string"
            ? extractedFields.gender.toLowerCase()
            : "";
    const extractedEmail =
        typeof extractedFields.email === "string" ? extractedFields.email : "";
    const extractedPhone =
        typeof extractedFields.phone_number === "string"
            ? extractedFields.phone_number
            : "";
    const extractedLocation =
        typeof extractedFields.location === "string"
            ? extractedFields.location
            : "";
    const extractedSkillsText = Array.isArray(extractedFields.skills)
        ? (extractedFields.skills as string[]).join(", ")
        : "";

    const nameValue = name || extractedName;
    const genderValue = gender || extractedGender;
    const emailValue = email || extractedEmail;
    const phoneValue = phone || extractedPhone;
    const locationValue = location || extractedLocation;
    const skillsValue = skills || extractedSkillsText;

    useEffect(() => {
        sendRef.current = sendAudioChunk ?? (() => {});
    }, [sendAudioChunk]);

    const handleFile = (
        type: "profile" | "front" | "back",
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () =>
            setPreviews((p) => ({ ...p, [type]: reader.result as string }));
        reader.readAsDataURL(file);
        if (type === "profile") setProfilePicture(file);
        if (type === "front") setLegalIdFront(file);
        if (type === "back") setLegalIdBack(file);
    };

    const toggleMic = () => {
        if (phase === "idle") connect();
        else if (
            phase === "greeting" ||
            phase === "asking" ||
            phase === "analyzing"
        )
            interrupt();
        else if (recording) stopAndAnalyze();
        else if (phase !== "complete") start();
    };

    const handleReExtract = () => {
        if (!transcript.trim()) return;
        setReExtracting(true);
        reExtract(transcript);
        setReExtracting(false);
    };

    const handleSubmit = () => {
        const skillArr = skillsValue
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        onSubmit({
            transcript,
            extractedFields: {
                ...(initialData?.age && { age: initialData.age }),
                ...extractedFields,
                ...(nameValue && { name: nameValue }),
                ...(genderValue && { gender: genderValue }),
                ...(emailValue && { email: emailValue }),
                ...(phoneValue && { phone_number: phoneValue }),
                ...(locationValue && { location: locationValue }),
                ...(skillArr.length && { skills: skillArr }),
            },
            password,
            profilePicture,
            legalIdFront,
            legalIdBack,
        });
    };

    const fieldEntries = useMemo(
        () =>
            Object.entries(extractedFields).filter(
                ([k, v]) =>
                    k !== "skills" &&
                    v != null &&
                    v !== "" &&
                    v !== false &&
                    v !== 0,
            ),
        [extractedFields],
    );

    const extractedSkills = Array.isArray(extractedFields.skills)
        ? (extractedFields.skills as string[])
        : [];

    const phaseLabel = useMemo(() => {
        if (phase === "idle") return S.phase_idle;
        if (phase === "greeting")
            return speaking ? S.phase_greeting : S.phase_connecting;
        if (phase === "listening")
            return recording ? S.phase_listening : S.phase_ready;
        if (phase === "analyzing") return S.phase_analyzing;
        if (phase === "asking")
            return speaking ? S.phase_asking_speaking : S.phase_asking;
        return S.phase_complete;
    }, [phase, speaking, recording]);

    const micLabel = useMemo(() => {
        if (recording) return S.mic_listening;
        if (phase === "idle") return S.mic_start;
        if (speaking || phase === "greeting" || phase === "asking")
            return S.mic_ai;
        if (phase === "analyzing") return S.mic_processing;
        if (phase === "complete") return S.mic_complete;
        return S.mic_continue;
    }, [phase, speaking, recording]);

    const inp =
        "w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-zinc-900 font-bold placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all";

    return (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Left column ── */}
            <div className="space-y-6">
                {/* Profile photo */}
                <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6">
                        {S.s_photo}
                    </h3>
                    <div
                        onClick={() => openPicker("profile")}
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
                                    {S.ph_photo}
                                </span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={profileFileRef}
                            className="hidden"
                            onChange={(e) => handleFile("profile", e)}
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* ID verification */}
                <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                    <h3 className="text-sm font-black text-zinc-900 mb-6">
                        {S.s_id}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => openPicker("front")}
                            className="aspect-4/3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden"
                        >
                            {previews.front ? (
                                <img
                                    src={previews.front}
                                    className="w-full h-full object-cover"
                                    alt="ID front"
                                />
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                                    <span className="text-[10px] font-black uppercase text-zinc-400">
                                        {S.ph_front}
                                    </span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={frontFileRef}
                                className="hidden"
                                onChange={(e) => handleFile("front", e)}
                                accept="image/*"
                            />
                        </div>

                        <div
                            onClick={() => openPicker("back")}
                            className="aspect-4/3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden"
                        >
                            {previews.back ? (
                                <img
                                    src={previews.back}
                                    className="w-full h-full object-cover"
                                    alt="ID back"
                                />
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                                    <span className="text-[10px] font-black uppercase text-zinc-400">
                                        {S.ph_back}
                                    </span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={backFileRef}
                                className="hidden"
                                onChange={(e) => handleFile("back", e)}
                                accept="image/*"
                            />
                        </div>
                    </div>
                </div>

                {/* Extracted tags */}
                {fieldEntries.length > 0 && (
                    <div className="bg-white rounded-4xl p-8 border border-zinc-100 shadow-sm">
                        <h3 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            {S.s_extracted}
                        </h3>
                        <div className="space-y-3">
                            {fieldEntries.map(([k, v]) => (
                                <div key={k} className="flex items-start gap-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-400 min-w-17.5 pt-0.5">
                                        {k.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm font-bold text-zinc-800">
                                        {String(v)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {extractedSkills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2">
                                    {S.s_skills}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {extractedSkills.map((sk, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-100"
                                        >
                                            {sk}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {missingFields.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                <span className="text-[10px] font-black uppercase text-amber-500 block mb-2">
                                    {S.s_needed}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {missingFields.map((f) => (
                                        <span
                                            key={f}
                                            className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full border border-amber-100"
                                        >
                                            {f.replace(/_/g, " ")}
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
                    <ArrowLeft className="w-4 h-4" />
                    {S.btn_back}
                </button>
            </div>

            {/* ── Right column ── */}
            <div className="relative">
                <div className="bg-white rounded-[40px] p-12 border border-zinc-100 shadow-xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent opacity-30" />

                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-6">
                        <div
                            className={`w-2 h-2 rounded-full ${phase === "listening" ? "bg-emerald-500 animate-pulse" : phase === "analyzing" ? "bg-amber-500 animate-pulse" : phase === "complete" ? "bg-emerald-500" : "bg-emerald-300"}`}
                        />
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                            {phaseLabel}
                        </span>
                    </div>

                    {/* AI message bubble */}
                    {aiMessage && (
                        <div className="w-full max-w-xl mb-6">
                            <div className="bg-emerald-50 rounded-3xl px-8 py-5 border border-emerald-100 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Volume2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                                        {S.ai_label}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                                    {aiMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Idle hero text */}
                    {phase === "idle" && (
                        <>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">
                                {S.title}
                            </h2>
                            <p className="text-zinc-400 font-medium max-w-sm mb-8">
                                {S.subtitle}
                            </p>
                        </>
                    )}

                    {/* Live transcript */}
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
                                    placeholder={S.transcript_ph}
                                    dir="auto"
                                    className="w-full bg-white border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-700 leading-relaxed italic resize-y min-h-32 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all placeholder:text-zinc-400 placeholder:not-italic"
                                />
                                {recording && (
                                    <span className="inline-block w-1.5 h-5 bg-emerald-400 mt-2 animate-pulse rounded-full" />
                                )}
                                {transcript.trim() && !recording && (
                                    <button
                                        type="button"
                                        onClick={handleReExtract}
                                        disabled={reExtracting}
                                        className="mt-3 px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wide transition-all disabled:opacity-50"
                                    >
                                        {reExtracting
                                            ? S.re_extracting
                                            : S.re_extract}
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
                                {S.phase_analyzing}
                            </span>
                        </div>
                    )}

                    {/* Mic button */}
                    <div className="relative mb-8">
                        <div
                            className={`absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 transition-all duration-500 ${recording ? "scale-150" : "scale-0 group-hover:scale-110"}`}
                        />
                        <button
                            onClick={toggleMic}
                            disabled={phase === "complete"}
                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                recording
                                    ? "bg-zinc-900 text-white scale-90"
                                    : speaking ||
                                        phase === "greeting" ||
                                        phase === "asking"
                                      ? "bg-red-500 text-white hover:bg-red-600 hover:scale-110 shadow-red-400/30"
                                      : phase === "analyzing"
                                        ? "bg-amber-400 text-white hover:bg-amber-500 hover:scale-110 shadow-amber-400/30"
                                        : "bg-emerald-400 text-black hover:scale-110 shadow-emerald-400/30"
                            }`}
                        >
                            {phase === "complete" ? (
                                <Check className="w-8 h-8" />
                            ) : recording ? (
                                <MicOff className="w-8 h-8" />
                            ) : speaking ||
                              phase === "greeting" ||
                              phase === "asking" ||
                              phase === "analyzing" ? (
                                <Square className="w-6 h-6 fill-current" />
                            ) : (
                                <Mic className="w-8 h-8" />
                            )}
                        </button>
                    </div>

                    <p
                        className={`text-sm font-black tracking-tight mb-6 transition-colors ${recording ? "text-emerald-500" : speaking ? "text-red-500" : phase === "complete" ? "text-emerald-600" : "text-zinc-900"}`}
                    >
                        {micLabel}
                    </p>

                    {/* Waveform */}
                    <div className="flex items-center gap-1.5 h-8 mb-8">
                        {levels.map((lv, i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{
                                    height: recording
                                        ? `${Math.max(15, lv * 100)}%`
                                        : "15%",
                                    opacity: recording
                                        ? Math.max(0.3, lv)
                                        : 0.2,
                                }}
                            />
                        ))}
                    </div>

                    {/* Editable account fields — always visible after idle so users can correct AI mistakes */}
                    {phase !== "idle" && (
                        <div className="w-full max-w-xl mb-8">
                            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <Pencil className="w-3 h-3" />
                                    {S.s_account}
                                </h3>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_name}
                                    </label>
                                    <input
                                        type="text"
                                        value={nameValue}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder={S.ph_name}
                                        dir="auto"
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_gender}
                                    </label>
                                    <div className="flex gap-2">
                                        {(
                                            [
                                                ["male", S.f_male],
                                                ["female", S.f_female],
                                                ["other", S.f_other],
                                            ] as const
                                        ).map(([val, lbl]) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setGender(val)}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${genderValue === val ? "bg-emerald-400 text-black border-emerald-500 shadow-sm" : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300"}`}
                                            >
                                                {lbl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_email}
                                    </label>
                                    <input
                                        type="email"
                                        value={emailValue}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder={S.ph_email}
                                        dir="auto"
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_phone}
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneValue}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        placeholder={S.ph_phone}
                                        dir="auto"
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_location}
                                    </label>
                                    <input
                                        type="text"
                                        value={locationValue}
                                        onChange={(e) =>
                                            setLocation(e.target.value)
                                        }
                                        placeholder={S.ph_location}
                                        dir="auto"
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_skills}
                                    </label>
                                    <input
                                        type="text"
                                        value={skillsValue}
                                        onChange={(e) =>
                                            setSkills(e.target.value)
                                        }
                                        placeholder={S.ph_skills}
                                        dir="auto"
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-zinc-900 mb-2">
                                        {S.f_password}
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder={S.ph_password}
                                        className={inp}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action bar */}
                    <div className="w-full pt-8 border-t border-zinc-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-3">
                            {phase !== "idle" && (
                                <button
                                    onClick={reset}
                                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {S.btn_reset}
                                </button>
                            )}
                            <button
                                onClick={onSwitchToManual}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-3 rounded-2xl font-black text-sm transition-all"
                            >
                                {S.btn_manual}
                            </button>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={
                                isLoading || phase !== "complete" || !password
                            }
                            className={`px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-[0.98] shadow-lg ${isLoading || phase !== "complete" || !password ? "bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none" : "bg-emerald-400 text-black hover:bg-emerald-500 shadow-emerald-400/20"}`}
                        >
                            {isLoading ? S.btn_processing : S.btn_submit}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
