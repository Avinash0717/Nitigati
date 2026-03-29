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
    mic_source_label: "Input Microphone",
    mic_source_default: "System default",
    mic_source_refresh: "Refresh",
    mic_source_none: "No microphone devices found",
    mic_no_signal:
        "No clear voice detected. Try another microphone from the list.",
    mic_audio_blocked:
        "Audio playback is blocked by the browser. Tap the mic again.",
    transcript_ph: "Speak now — I'm listening…",
    re_extract: "Re-extract from transcript",
    re_extracting: "Re-extracting…",
    ai_label: "AI Assistant",
    ai_greeting:
        "Hello! Tell me your name, what you do, your skills, and where you're based. Any language is fine.",
    ai_audio_only_hint:
        "Connected. Start speaking to begin onboarding. Tap again to send your turn.",
    ai_no_input_hint:
        "I could not hear a clear voice. Try another microphone and speak a bit closer.",
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
    f_password: "Password",
    ph_name: "Your full name",
    ph_email: "you@example.com",
    ph_phone: "+1 555 000 0000",
    ph_location: "City, Country",
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

const ONBOARDING_DEBUG = process.env.NEXT_PUBLIC_ONBOARDING_DEBUG !== "0";
const LOG_SCOPE = "[AI_ONBOARDING]";
let logSequence = 0;

function debugLog(event: string, details?: Record<string, unknown>) {
    if (!ONBOARDING_DEBUG) return;
    logSequence += 1;
    const prefix = `${LOG_SCOPE}#${logSequence} ${new Date().toISOString()} ${event}`;
    if (details) {
        console.info(prefix, details);
        return;
    }
    console.info(prefix);
}

function debugWarn(event: string, details?: Record<string, unknown>) {
    if (!ONBOARDING_DEBUG) return;
    logSequence += 1;
    const prefix = `${LOG_SCOPE}#${logSequence} ${new Date().toISOString()} ${event}`;
    if (details) {
        console.warn(prefix, details);
        return;
    }
    console.warn(prefix);
}

function summarizeText(text: string, max = 140): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
}

const TARGET_INPUT_SAMPLE_RATE = 16000;
const DEFAULT_OUTPUT_SAMPLE_RATE = 24000;
const TARGET_INPUT_PEAK = 12000;
const MAX_INPUT_GAIN = 4;

const parsedOutputGain = Number(
    process.env.NEXT_PUBLIC_GEMINI_OUTPUT_GAIN || "1.6",
);
const OUTPUT_AUDIO_GAIN = Number.isFinite(parsedOutputGain)
    ? Math.max(0.5, Math.min(3, parsedOutputGain))
    : 1.6;

function toInt16Pcm(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        out[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
    }
    return out;
}

function downsampleToTargetRate(
    input: Float32Array,
    sourceRate: number,
    targetRate: number,
): Int16Array {
    if (sourceRate <= targetRate) {
        return toInt16Pcm(input);
    }

    const ratio = sourceRate / targetRate;
    const outputLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Int16Array(outputLength);
    let inOffset = 0;

    for (let outIndex = 0; outIndex < outputLength; outIndex++) {
        const nextInOffset = Math.min(
            input.length,
            Math.round((outIndex + 1) * ratio),
        );
        let sum = 0;
        let count = 0;
        for (let i = inOffset; i < nextInOffset; i++) {
            sum += input[i];
            count += 1;
        }
        const avg = count > 0 ? sum / count : 0;
        const clamped = Math.max(-1, Math.min(1, avg));
        output[outIndex] =
            clamped < 0
                ? Math.round(clamped * 32768)
                : Math.round(clamped * 32767);
        inOffset = nextInOffset;
    }

    return output;
}

function pcm16ToBase64(samples: Int16Array): string {
    const bytes = new Uint8Array(samples.buffer);
    let bin = "";
    bytes.forEach((b) => {
        bin += String.fromCharCode(b);
    });
    return btoa(bin);
}

function normalizeInputPcm(samples: Int16Array): Int16Array {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
        const abs = Math.abs(samples[i]);
        if (abs > peak) peak = abs;
    }

    if (!peak) {
        return samples;
    }

    const desiredGain = TARGET_INPUT_PEAK / peak;
    const gain = Math.max(1, Math.min(MAX_INPUT_GAIN, desiredGain));
    if (gain <= 1.05) {
        return samples;
    }

    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        const boosted = Math.round(samples[i] * gain);
        out[i] = Math.max(-32768, Math.min(32767, boosted));
    }

    return out;
}

function parseSampleRateFromMimeType(mimeType?: string): number {
    if (!mimeType) {
        return DEFAULT_OUTPUT_SAMPLE_RATE;
    }

    const m = mimeType.match(/(?:rate|sample_rate)\s*=\s*(\d{4,6})/i);
    const parsed = m ? Number(m[1]) : NaN;
    if (!Number.isFinite(parsed)) {
        return DEFAULT_OUTPUT_SAMPLE_RATE;
    }

    return Math.max(8000, Math.min(96000, parsed));
}

function mergeStreamingText(current: string, incoming: string): string {
    const base = current.trim();
    const chunk = incoming.trim();
    if (!base) return chunk;
    if (!chunk) return base;
    if (chunk.startsWith(base)) return chunk;
    if (base.startsWith(chunk)) return base;

    const maxOverlap = Math.min(base.length, chunk.length);
    for (let overlap = maxOverlap; overlap > 0; overlap--) {
        const left = base.slice(-overlap).toLowerCase();
        const right = chunk.slice(0, overlap).toLowerCase();
        if (left === right) {
            return `${base}${chunk.slice(overlap)}`.replace(/\s+/g, " ").trim();
        }
    }

    return `${base} ${chunk}`.replace(/\s+/g, " ").trim();
}

interface BrowserSpeechRecognitionResult {
    isFinal: boolean;
    0: {
        transcript: string;
    };
}

interface BrowserSpeechRecognitionEvent {
    resultIndex: number;
    results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error?: string; message?: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

interface MicrophoneOption {
    deviceId: string;
    label: string;
}

function useMicrophoneDevices() {
    const [microphones, setMicrophones] = useState<MicrophoneOption[]>([]);
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");

    const refreshMicrophones = useCallback(async () => {
        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.enumerateDevices
        ) {
            return;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices
                .filter((d) => d.kind === "audioinput")
                .map((d, i) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Microphone ${i + 1}`,
                }));

            setMicrophones(audioInputs);
            setSelectedMicrophoneId((current) => {
                if (audioInputs.some((d) => d.deviceId === current)) {
                    return current;
                }
                return audioInputs[0]?.deviceId || "";
            });

            debugLog("microphone_devices_updated", {
                count: audioInputs.length,
            });
        } catch (err) {
            debugWarn("microphone_devices_failed", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }, []);

    useEffect(() => {
        const initTimer = setTimeout(() => {
            void refreshMicrophones();
        }, 0);

        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
            return;
        }

        const onDeviceChange = () => {
            void refreshMicrophones();
        };

        navigator.mediaDevices.addEventListener?.(
            "devicechange",
            onDeviceChange,
        );

        return () => {
            clearTimeout(initTimer);
            navigator.mediaDevices.removeEventListener?.(
                "devicechange",
                onDeviceChange,
            );
        };
    }, [refreshMicrophones]);

    return {
        microphones,
        selectedMicrophoneId,
        setSelectedMicrophoneId,
        refreshMicrophones,
    };
}

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
    private closingByClient = false;
    private sentAudioChunks = 0;
    private receivedAudioChunks = 0;
    private inputTranscriptionChunks = 0;
    private outputTranscriptionChunks = 0;
    private unhandledMessageCount = 0;
    private readonly audioOnlyCompat =
        process.env.NEXT_PUBLIC_GEMINI_AUDIO_ONLY_COMPAT !== "0" &&
        /gemini-3\.1.*live/i.test(this.model);

    onText: (t: string) => void = () => {};
    onInputTranscription: (t: string, finished: boolean) => void = () => {};
    onOutputTranscription: (t: string, finished: boolean) => void = () => {};
    onAudio: (b64: string, sampleRate: number) => void = () => {};
    onTurnComplete: () => void = () => {};
    onError: (msg: string) => void = () => {};
    onClose: (info: {
        code: number;
        reason: string;
        triggeredByClient: boolean;
    }) => void = () => {};

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

        debugLog("model_resolved", {
            requestedModel: requested,
        });

        return requested;
    }

    async connect(): Promise<void> {
        this.closingByClient = false;
        debugLog("connect_start", {
            model: this.model,
            hasApiKey: Boolean(this.apiKey),
            apiKeyLength: this.apiKey?.length ?? 0,
            audioOnlyCompat: this.audioOnlyCompat,
        });
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        let session: {
            sendRealtimeInput: (params: unknown) => void;
            sendClientContent: (params: unknown) => void;
            close: () => void;
        };
        let connectTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

        try {
            session = (await Promise.race([
                ai.live.connect({
                    model: this.model,
                    config: {
                        responseModalities: this.audioOnlyCompat
                            ? [Modality.AUDIO]
                            : [Modality.TEXT, Modality.AUDIO],
                        inputAudioTranscription: this.audioOnlyCompat
                            ? {}
                            : undefined,
                        outputAudioTranscription: this.audioOnlyCompat
                            ? {}
                            : undefined,
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
                            debugLog("live_socket_open", {
                                model: this.model,
                            });
                        },
                        onmessage: (msg: unknown) => {
                            const liveMsg = msg as {
                                error?: { message?: string; code?: number };
                                text?: string;
                                data?: string;
                                serverContent?: {
                                    turnComplete?: boolean;
                                    generationComplete?: boolean;
                                    waitingForInput?: boolean;
                                    interrupted?: boolean;
                                    modelTurn?: {
                                        parts?: Array<{
                                            text?: string;
                                            inlineData?: {
                                                data?: string;
                                                mimeType?: string;
                                            };
                                        }>;
                                    };
                                    inputTranscription?: {
                                        text?: string;
                                        finished?: boolean;
                                    };
                                    outputTranscription?: {
                                        text?: string;
                                        finished?: boolean;
                                    };
                                };
                            };

                            const err = liveMsg?.error;
                            if (err) {
                                const message =
                                    err.message ||
                                    `Gemini setup failed${err.code ? ` (code ${err.code})` : ""}.`;
                                debugWarn("live_message_error", {
                                    code: err.code,
                                    message,
                                });
                                this.onError(message);
                                return;
                            }

                            let handledPayload = false;

                            const setupComplete = (
                                liveMsg as {
                                    setupComplete?: unknown;
                                }
                            )?.setupComplete;
                            const usageMetadata = (
                                liveMsg as {
                                    usageMetadata?: unknown;
                                }
                            )?.usageMetadata;
                            const toolCall = (
                                liveMsg as {
                                    toolCall?: unknown;
                                }
                            )?.toolCall;
                            const toolCallCancellation = (
                                liveMsg as {
                                    toolCallCancellation?: unknown;
                                }
                            )?.toolCallCancellation;
                            const sessionResumptionUpdate = (
                                liveMsg as {
                                    sessionResumptionUpdate?: unknown;
                                }
                            )?.sessionResumptionUpdate;
                            const voiceActivity = (
                                liveMsg as {
                                    voiceActivity?: {
                                        voiceActivityType?: string;
                                    };
                                }
                            )?.voiceActivity;
                            const voiceActivityDetectionSignal = (
                                liveMsg as {
                                    voiceActivityDetectionSignal?: {
                                        vadSignalType?: string;
                                    };
                                }
                            )?.voiceActivityDetectionSignal;
                            const goAway = (
                                liveMsg as {
                                    goAway?: {
                                        timeLeft?: string;
                                    };
                                }
                            )?.goAway;

                            if (
                                setupComplete ||
                                usageMetadata ||
                                toolCall ||
                                toolCallCancellation ||
                                sessionResumptionUpdate ||
                                voiceActivity ||
                                voiceActivityDetectionSignal ||
                                goAway
                            ) {
                                handledPayload = true;
                            }

                            if (voiceActivity?.voiceActivityType) {
                                debugLog("live_voice_activity", {
                                    type: voiceActivity.voiceActivityType,
                                });
                            }

                            if (voiceActivityDetectionSignal?.vadSignalType) {
                                debugLog("live_vad_signal", {
                                    type: voiceActivityDetectionSignal.vadSignalType,
                                });
                            }

                            if (goAway?.timeLeft) {
                                debugWarn("live_go_away", {
                                    timeLeft: goAway.timeLeft,
                                });
                            }

                            const modelParts =
                                liveMsg?.serverContent?.modelTurn?.parts;
                            let partTextCount = 0;
                            let partAudioCount = 0;

                            if (
                                Array.isArray(modelParts) &&
                                modelParts.length
                            ) {
                                for (const part of modelParts) {
                                    if (
                                        typeof part?.text === "string" &&
                                        part.text.trim()
                                    ) {
                                        partTextCount += 1;
                                        handledPayload = true;
                                        debugLog("live_model_text_part", {
                                            textPreview: summarizeText(
                                                part.text,
                                            ),
                                            length: part.text.length,
                                        });
                                        this.onText(part.text);
                                    }

                                    const partAudio = part?.inlineData?.data;
                                    if (
                                        typeof partAudio === "string" &&
                                        partAudio
                                    ) {
                                        partAudioCount += 1;
                                        handledPayload = true;
                                        this.receivedAudioChunks += 1;
                                        if (
                                            this.receivedAudioChunks <= 5 ||
                                            this.receivedAudioChunks % 25 === 0
                                        ) {
                                            debugLog("live_audio_received", {
                                                chunkIndex:
                                                    this.receivedAudioChunks,
                                                base64Length: partAudio.length,
                                                mimeType:
                                                    part?.inlineData
                                                        ?.mimeType ||
                                                    "(unknown)",
                                            });
                                        }
                                        this.onAudio(
                                            partAudio,
                                            parseSampleRateFromMimeType(
                                                part?.inlineData?.mimeType,
                                            ),
                                        );
                                    }
                                }

                                debugLog("live_model_turn_parts_received", {
                                    partCount: modelParts.length,
                                    textParts: partTextCount,
                                    audioParts: partAudioCount,
                                });
                            }

                            if (
                                !partTextCount &&
                                typeof liveMsg?.text === "string" &&
                                liveMsg.text.trim()
                            ) {
                                handledPayload = true;
                                debugLog("live_text_received", {
                                    textPreview: summarizeText(liveMsg.text),
                                    length: liveMsg.text.length,
                                });
                                this.onText(liveMsg.text);
                            }

                            if (
                                !partAudioCount &&
                                typeof liveMsg?.data === "string" &&
                                liveMsg.data
                            ) {
                                handledPayload = true;
                                this.receivedAudioChunks += 1;
                                if (
                                    this.receivedAudioChunks <= 5 ||
                                    this.receivedAudioChunks % 25 === 0
                                ) {
                                    debugLog("live_audio_received", {
                                        chunkIndex: this.receivedAudioChunks,
                                        base64Length: liveMsg.data.length,
                                    });
                                }
                                this.onAudio(
                                    liveMsg.data,
                                    DEFAULT_OUTPUT_SAMPLE_RATE,
                                );
                            }

                            const inputTx =
                                liveMsg?.serverContent?.inputTranscription;
                            if (
                                typeof inputTx?.text === "string" &&
                                inputTx.text.trim()
                            ) {
                                handledPayload = true;
                                this.inputTranscriptionChunks += 1;
                                debugLog("input_transcription_received", {
                                    chunkIndex: this.inputTranscriptionChunks,
                                    finished: Boolean(inputTx.finished),
                                    textPreview: summarizeText(inputTx.text),
                                });
                                this.onInputTranscription(
                                    inputTx.text,
                                    Boolean(inputTx.finished),
                                );
                            }

                            const outputTx =
                                liveMsg?.serverContent?.outputTranscription;
                            if (
                                typeof outputTx?.text === "string" &&
                                outputTx.text.trim()
                            ) {
                                handledPayload = true;
                                this.outputTranscriptionChunks += 1;
                                debugLog("output_transcription_received", {
                                    chunkIndex: this.outputTranscriptionChunks,
                                    finished: Boolean(outputTx.finished),
                                    textPreview: summarizeText(outputTx.text),
                                });
                                this.onOutputTranscription(
                                    outputTx.text,
                                    Boolean(outputTx.finished),
                                );
                            }

                            if (liveMsg?.serverContent?.generationComplete) {
                                handledPayload = true;
                                debugLog("live_generation_complete");
                            }

                            if (liveMsg?.serverContent?.waitingForInput) {
                                handledPayload = true;
                                debugLog("live_waiting_for_input");
                            }

                            if (liveMsg?.serverContent?.interrupted) {
                                handledPayload = true;
                                debugLog("live_generation_interrupted");
                            }

                            if (liveMsg?.serverContent?.turnComplete) {
                                handledPayload = true;
                                debugLog("live_turn_complete");
                                this.onTurnComplete();
                            }

                            if (
                                !handledPayload &&
                                this.unhandledMessageCount < 5
                            ) {
                                this.unhandledMessageCount += 1;
                                const topLevelKeys = Object.keys(liveMsg || {});
                                const serverContentKeys = Object.keys(
                                    liveMsg?.serverContent || {},
                                );
                                debugLog("live_message_unhandled_shape", {
                                    topLevelKeys,
                                    topLevelKeysCsv: topLevelKeys.join(","),
                                    serverContentKeys,
                                    serverContentKeysCsv:
                                        serverContentKeys.join(","),
                                    hasModelTurn: Boolean(
                                        liveMsg?.serverContent?.modelTurn,
                                    ),
                                });
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            const message =
                                e?.error?.message ||
                                e?.message ||
                                `${S.err_gemini} (SDK live error)`;
                            debugWarn("live_socket_error", {
                                message,
                            });
                            this.onError(message);
                        },
                        onclose: (e: CloseEvent) => {
                            const triggeredByClient = this.closingByClient;
                            debugWarn("live_socket_closed", {
                                code: e.code,
                                reason: e.reason || "(none)",
                                wasConnected: this.connected,
                                triggeredByClient,
                            });
                            this.onClose({
                                code: e.code,
                                reason: e.reason || "(none)",
                                triggeredByClient,
                            });
                            if (!this.connected && !triggeredByClient) {
                                this.onError(
                                    `Live session closed before ready. code=${e.code} reason=${e.reason || "(none)"}`,
                                );
                            }
                            this.connected = false;
                            this.closingByClient = false;
                        },
                    },
                }),
                new Promise<never>((_, reject) => {
                    connectTimeoutHandle = setTimeout(() => {
                        debugWarn("connect_timeout", {
                            model: this.model,
                            timeoutMs: 30000,
                        });
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
            debugWarn("connect_failed", {
                model: this.model,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err instanceof Error ? err : new Error(String(err));
        } finally {
            if (connectTimeoutHandle !== undefined) {
                clearTimeout(connectTimeoutHandle);
            }
        }

        this.session = session;
        this.connected = true;
        debugLog("connect_ready", {
            model: this.model,
            audioOnlyCompat: this.audioOnlyCompat,
        });
    }

    sendAudio(b64: string, sampleRate = TARGET_INPUT_SAMPLE_RATE) {
        this.sentAudioChunks += 1;
        if (this.sentAudioChunks <= 5 || this.sentAudioChunks % 25 === 0) {
            debugLog("audio_chunk_sent", {
                chunkIndex: this.sentAudioChunks,
                base64Length: b64.length,
                hasSession: Boolean(this.session),
                sampleRate,
            });
        }
        this.session?.sendRealtimeInput({
            audio: {
                mimeType: `audio/pcm;rate=${sampleRate}`,
                data: b64,
            },
        });
    }

    sendText(text: string) {
        debugLog("client_text_sent", {
            textPreview: summarizeText(text),
            length: text.length,
            hasSession: Boolean(this.session),
            audioOnlyCompat: this.audioOnlyCompat,
        });
        this.session?.sendClientContent({
            turns: [{ role: "user", parts: [{ text }] }],
            turnComplete: true,
        });
    }

    sendRealtimeText(text: string) {
        debugLog("client_realtime_text_sent", {
            textPreview: summarizeText(text),
            length: text.length,
            hasSession: Boolean(this.session),
            audioOnlyCompat: this.audioOnlyCompat,
        });
        this.session?.sendRealtimeInput({
            text,
        });
    }

    endAudioStream() {
        debugLog("audio_stream_end_sent", {
            hasSession: Boolean(this.session),
            audioOnlyCompat: this.audioOnlyCompat,
        });
        this.session?.sendRealtimeInput({
            audioStreamEnd: true,
        });
        if (this.audioOnlyCompat) {
            debugLog("audio_turn_complete_via_stream_end", {
                hasSession: Boolean(this.session),
            });
        }
    }

    isAudioOnlyCompatMode() {
        return this.audioOnlyCompat;
    }

    close() {
        this.closingByClient = true;
        debugLog("session_close", {
            wasConnected: this.connected,
            hadSession: Boolean(this.session),
        });
        this.connected = false;
        this.session?.close();
        this.session = null;
    }
}

/* ── Audio pipeline hook ─────────────────────────────────────────────── */
function useAudioPipeline(
    onChunk: (b64: string, sampleRate: number) => void,
    selectedMicrophoneId: string,
    onMicrophoneReady?: () => void,
    onNoSignal?: () => void,
) {
    const r = useRef({
        stream: null as MediaStream | null,
        ctx: null as AudioContext | null,
        proc: null as ScriptProcessorNode | null,
        monitorGain: null as GainNode | null,
        raf: null as number | null,
        analyser: null as AnalyserNode | null,
        sourceSampleRate: TARGET_INPUT_SAMPLE_RATE,
        processedFrames: 0,
        voicedFrames: 0,
        active: false,
        ttsCtx: null as AudioContext | null,
        ttsGain: null as GainNode | null,
        ttsNextStartTime: 0,
        ttsSources: new Set<AudioBufferSourceNode>(),
    });

    const [levels, setLevels] = useState<number[]>(new Array(9).fill(0));
    const [recording, setRecording] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    // Stable ref so useCallback deps stay empty
    const onChunkRef = useRef(onChunk);
    useEffect(() => {
        onChunkRef.current = onChunk;
    }, [onChunk]);

    const onMicrophoneReadyRef = useRef(onMicrophoneReady);
    useEffect(() => {
        onMicrophoneReadyRef.current = onMicrophoneReady;
    }, [onMicrophoneReady]);

    const onNoSignalRef = useRef(onNoSignal);
    useEffect(() => {
        onNoSignalRef.current = onNoSignal;
    }, [onNoSignal]);

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
        debugLog("mic_start_requested");
        let stream: MediaStream;

        const supportedConstraints =
            navigator.mediaDevices?.getSupportedConstraints?.() || {};
        const audioConstraints: MediaTrackConstraints = {};

        if (supportedConstraints.deviceId && selectedMicrophoneId) {
            audioConstraints.deviceId = { exact: selectedMicrophoneId };
        }
        if (supportedConstraints.echoCancellation) {
            audioConstraints.echoCancellation = true;
        }
        if (supportedConstraints.noiseSuppression) {
            audioConstraints.noiseSuppression = true;
        }
        if (supportedConstraints.autoGainControl) {
            audioConstraints.autoGainControl = true;
        }
        if (supportedConstraints.channelCount) {
            audioConstraints.channelCount = 1;
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio:
                    Object.keys(audioConstraints).length > 0
                        ? audioConstraints
                        : true,
            });
        } catch (err) {
            // Fallback: if selected device cannot be opened, retry with default device.
            if (selectedMicrophoneId) {
                debugWarn("mic_selected_device_failed", {
                    selectedMicrophoneId,
                    error: err instanceof Error ? err.message : String(err),
                });
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    });
                } catch {
                    debugWarn("mic_start_failed_permission");
                    alert(S.err_mic);
                    return;
                }
            } else {
                debugWarn("mic_start_failed_permission");
                alert(S.err_mic);
                return;
            }
        }

        r.current.stream = stream;
        r.current.processedFrames = 0;
        r.current.voicedFrames = 0;

        const micTrack = stream.getAudioTracks()[0];
        debugLog("mic_stream_selected", {
            selectedMicrophoneId: selectedMicrophoneId || "(default)",
            trackLabel: micTrack?.label || "(unlabeled)",
        });

        onMicrophoneReadyRef.current?.();

        const ctx = new AudioContext();
        r.current.ctx = ctx;
        r.current.sourceSampleRate = ctx.sampleRate;
        if (ctx.state === "suspended") await ctx.resume();

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        r.current.analyser = analyser;

        const proc = ctx.createScriptProcessor(2048, 1, 1);
        proc.onaudioprocess = (e) => {
            if (!r.current.active) return;
            const f32 = e.inputBuffer.getChannelData(0);

            let sumSquares = 0;
            for (let i = 0; i < f32.length; i++) {
                const s = f32[i];
                sumSquares += s * s;
            }
            const rms = Math.sqrt(sumSquares / f32.length);
            r.current.processedFrames += 1;
            if (rms > 0.008) {
                r.current.voicedFrames += 1;
            }

            const i16 = downsampleToTargetRate(
                f32,
                r.current.sourceSampleRate,
                TARGET_INPUT_SAMPLE_RATE,
            );
            const normalized = normalizeInputPcm(i16);
            onChunkRef.current(
                pcm16ToBase64(normalized),
                TARGET_INPUT_SAMPLE_RATE,
            );
        };
        src.connect(proc);
        const monitorGain = ctx.createGain();
        monitorGain.gain.value = 0;
        proc.connect(monitorGain);
        monitorGain.connect(ctx.destination);
        r.current.proc = proc;
        r.current.monitorGain = monitorGain;
        r.current.active = true;
        setRecording(true);
        debugLog("mic_started", {
            contextSampleRate: ctx.sampleRate,
            outputSampleRate: TARGET_INPUT_SAMPLE_RATE,
            selectedMicrophoneId: selectedMicrophoneId || "(default)",
        });
        tick();
    }, [selectedMicrophoneId, tick]);

    const stop = useCallback(() => {
        debugLog("mic_stop_requested", {
            wasActive: r.current.active,
        });

        const detectedVoice = r.current.voicedFrames > 0;
        debugLog("mic_capture_summary", {
            frames: r.current.processedFrames,
            voicedFrames: r.current.voicedFrames,
            detectedVoice,
            selectedMicrophoneId: selectedMicrophoneId || "(default)",
        });
        if (r.current.processedFrames > 0 && !detectedVoice) {
            debugWarn("mic_no_signal_detected", {
                selectedMicrophoneId: selectedMicrophoneId || "(default)",
            });
            onNoSignalRef.current?.();
        }

        r.current.active = false;
        setRecording(false);
        setLevels((prev) =>
            prev.every((value) => value === 0) ? prev : new Array(9).fill(0),
        );
        if (r.current.raf) {
            cancelAnimationFrame(r.current.raf);
            r.current.raf = null;
        }
        r.current.processedFrames = 0;
        r.current.voicedFrames = 0;
        r.current.proc?.disconnect();
        r.current.proc = null;
        r.current.monitorGain?.disconnect();
        r.current.monitorGain = null;
        r.current.stream?.getTracks().forEach((t) => t.stop());
        r.current.stream = null;
        if (r.current.ctx?.state !== "closed") r.current.ctx?.close();
        r.current.ctx = null;
        debugLog("mic_stopped");
    }, [selectedMicrophoneId]);

    const primePlayback = useCallback(async (): Promise<boolean> => {
        if (!r.current.ttsCtx || r.current.ttsCtx.state === "closed") {
            r.current.ttsCtx = new AudioContext();
            r.current.ttsGain = null;
            r.current.ttsNextStartTime = 0;
        }

        const ttsCtx = r.current.ttsCtx;
        if (!ttsCtx) {
            return false;
        }

        if (!r.current.ttsGain) {
            const gainNode = ttsCtx.createGain();
            gainNode.gain.value = OUTPUT_AUDIO_GAIN;
            gainNode.connect(ttsCtx.destination);
            r.current.ttsGain = gainNode;
        }

        if (ttsCtx.state !== "running") {
            try {
                await ttsCtx.resume();
            } catch (err) {
                debugWarn("tts_context_resume_failed", {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        if (ttsCtx.state !== "running") {
            return false;
        }

        try {
            const silent = ttsCtx.createBufferSource();
            silent.buffer = ttsCtx.createBuffer(1, 1, ttsCtx.sampleRate);
            silent.connect(r.current.ttsGain || ttsCtx.destination);
            silent.start();
        } catch {
            // Silent prime is best-effort only.
        }

        return true;
    }, []);

    const playTTS = useCallback(
        (
            b64pcm: string,
            sampleRate = DEFAULT_OUTPUT_SAMPLE_RATE,
        ): Promise<void> => {
            return new Promise((resolve) => {
                const execute = async () => {
                    debugLog("tts_play_requested", {
                        base64Length: b64pcm.length,
                        sampleRate,
                    });

                    const playbackReady = await primePlayback();
                    const ttsCtx = r.current.ttsCtx;
                    if (!playbackReady || !ttsCtx) {
                        debugWarn("tts_play_blocked", {
                            playbackReady,
                            contextState: ttsCtx?.state,
                        });
                        resolve();
                        return;
                    }

                    let pcm: Uint8Array;
                    try {
                        pcm = Uint8Array.from(atob(b64pcm), (c) =>
                            c.charCodeAt(0),
                        );
                    } catch (err) {
                        debugWarn("tts_base64_decode_failed", {
                            error:
                                err instanceof Error
                                    ? err.message
                                    : String(err),
                        });
                        resolve();
                        return;
                    }

                    const sampleCount = Math.floor(pcm.byteLength / 2);
                    if (!sampleCount) {
                        resolve();
                        return;
                    }

                    const f32 = new Float32Array(sampleCount);
                    for (let i = 0; i < sampleCount; i++) {
                        const lo = pcm[i * 2];
                        const hi = pcm[i * 2 + 1];
                        const value = (hi << 8) | lo;
                        const signed = value >= 0x8000 ? value - 0x10000 : value;
                        f32[i] = signed / 32768;
                    }

                    const resolvedSampleRate = Number.isFinite(sampleRate)
                        ? Math.max(8000, Math.min(96000, sampleRate))
                        : DEFAULT_OUTPUT_SAMPLE_RATE;
                    const buffer = ttsCtx.createBuffer(
                        1,
                        sampleCount,
                        resolvedSampleRate,
                    );
                    buffer.copyToChannel(f32, 0);

                    const source = ttsCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(r.current.ttsGain || ttsCtx.destination);

                    const startAt = Math.max(
                        r.current.ttsNextStartTime,
                        ttsCtx.currentTime + 0.01,
                    );
                    r.current.ttsNextStartTime = startAt + buffer.duration;

                    setSpeaking(true);
                    r.current.ttsSources.add(source);

                    const fallbackMs = Math.max(
                        900,
                        Math.round((buffer.duration + 0.4) * 1000),
                    );
                    const timeoutId = setTimeout(() => {
                        if (!r.current.ttsSources.has(source)) {
                            return;
                        }
                        r.current.ttsSources.delete(source);
                        if (!r.current.ttsSources.size) {
                            setSpeaking(false);
                        }
                        debugWarn("tts_play_timeout", {
                            fallbackMs,
                            contextState: ttsCtx.state,
                        });
                        resolve();
                    }, fallbackMs);

                    source.onended = () => {
                        clearTimeout(timeoutId);
                        r.current.ttsSources.delete(source);
                        if (!r.current.ttsSources.size) {
                            setSpeaking(false);
                        }
                        debugLog("tts_play_finished", {
                            remainingSources: r.current.ttsSources.size,
                        });
                        resolve();
                    };

                    try {
                        source.start(startAt);
                    } catch (err) {
                        clearTimeout(timeoutId);
                        r.current.ttsSources.delete(source);
                        if (!r.current.ttsSources.size) {
                            setSpeaking(false);
                        }
                        debugWarn("tts_source_start_failed", {
                            error:
                                err instanceof Error
                                    ? err.message
                                    : String(err),
                        });
                        resolve();
                    }
                };

                void execute();
            });
        },
        [primePlayback],
    );

    const stopTTS = useCallback(() => {
        debugLog("tts_stop_requested", {
            activeSources: r.current.ttsSources.size,
        });

        for (const source of r.current.ttsSources) {
            try {
                source.stop();
            } catch {
                // No-op: source may already be stopped.
            }
        }
        r.current.ttsSources.clear();
        r.current.ttsNextStartTime = 0;

        if (r.current.ttsCtx && r.current.ttsCtx.state !== "closed") {
            void r.current.ttsCtx.close();
        }
        r.current.ttsCtx = null;
        r.current.ttsGain = null;
        setSpeaking(false);
    }, []);

    useEffect(
        () => () => {
            stop();
            stopTTS();
        },
        [stop, stopTTS],
    );

    return {
        start,
        stop,
        playTTS,
        stopTTS,
        primePlayback,
        levels,
        recording,
        speaking,
    };
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
    playTTS: (b64: string, sampleRate: number) => Promise<void>,
    stopTTS: () => void,
    startMic: () => Promise<void>,
    stopMic: () => void,
) {
    const gem = useRef<GeminiLiveSession | null>(null);
    const phaseRef = useRef<Phase>("idle");
    const queue = useRef<Array<{ b64: string; sampleRate: number }>>([]);
    const playing = useRef(false);
    const connecting = useRef(false);
    const inboundAudioCount = useRef(0);
    const closingExpected = useRef(false);
    const transcriptRef = useRef("");
    const browserSpeechRef = useRef<BrowserSpeechRecognition | null>(null);
    const startBrowserSpeechFallbackRef = useRef<() => void>(() => {});
    const noTranscriptFallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const hasGeminiInputText = useRef(false);
    const browserSpeechChunks = useRef(0);
    const transcriptCommittedRef = useRef("");
    const transcriptInterimRef = useRef("");
    const aiCommittedRef = useRef("");
    const aiInterimRef = useRef("");
    const hasOutputTranscriptionRef = useRef(false);

    const [st, setSt] = useState<SessionState>({
        phase: "idle",
        transcript: "",
        aiMessage: "",
        fields: {},
        missing: [],
    });

    useEffect(() => {
        transcriptRef.current = st.transcript;
    }, [st.transcript]);

    const setPhase = useCallback((p: Phase) => {
        const from = phaseRef.current;
        phaseRef.current = p;
        if (from !== p) {
            debugLog("phase_transition", {
                from,
                to: p,
            });
        }
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

    const clearNoTranscriptFallbackTimer = useCallback(() => {
        if (noTranscriptFallbackTimer.current) {
            clearTimeout(noTranscriptFallbackTimer.current);
            noTranscriptFallbackTimer.current = null;
        }
    }, []);

    const stopBrowserSpeechFallback = useCallback(() => {
        clearNoTranscriptFallbackTimer();
        const recognition = browserSpeechRef.current;
        browserSpeechRef.current = null;
        if (!recognition) return;

        try {
            recognition.stop();
        } catch {
            try {
                recognition.abort();
            } catch {
                // No-op: recognition may already be closed.
            }
        }

        debugLog("browser_speech_fallback_stopped");
    }, [clearNoTranscriptFallbackTimer]);

    const startBrowserSpeechFallback = useCallback(() => {
        if (typeof window === "undefined" || browserSpeechRef.current) {
            return;
        }

        const speechWindow = window as Window & {
            SpeechRecognition?: BrowserSpeechRecognitionCtor;
            webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
        };

        const SpeechRecognitionCtor =
            speechWindow.SpeechRecognition ||
            speechWindow.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {
            debugWarn("browser_speech_fallback_not_supported");
            return;
        }

        try {
            const recognition = new SpeechRecognitionCtor();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let finalChunk = "";
                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i += 1
                ) {
                    const item = event.results[i];
                    if (item?.isFinal) {
                        finalChunk += item[0]?.transcript || "";
                    }
                }

                const cleaned = finalChunk.trim();
                if (!cleaned) return;

                browserSpeechChunks.current += 1;
                debugLog("browser_speech_fallback_chunk", {
                    chunkIndex: browserSpeechChunks.current,
                    textPreview: summarizeText(cleaned),
                });

                setSt((s) => {
                    const mergedTranscript = mergeStreamingText(
                        s.transcript,
                        cleaned,
                    );
                    return {
                        ...s,
                        transcript: mergedTranscript,
                        fields: extract(mergedTranscript),
                    };
                });
            };

            recognition.onerror = (event) => {
                debugWarn("browser_speech_fallback_error", {
                    error: event?.error || event?.message || "unknown",
                });
            };

            recognition.onend = () => {
                if (browserSpeechRef.current === recognition) {
                    browserSpeechRef.current = null;
                }
                debugLog("browser_speech_fallback_ended");

                if (phaseRef.current === "listening") {
                    setTimeout(() => {
                        if (
                            phaseRef.current === "listening" &&
                            !browserSpeechRef.current
                        ) {
                            startBrowserSpeechFallbackRef.current();
                        }
                    }, 250);
                }
            };

            recognition.start();
            browserSpeechRef.current = recognition;
            debugLog("browser_speech_fallback_started");
        } catch (err) {
            debugWarn("browser_speech_fallback_start_failed", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }, [extract]);

    useEffect(() => {
        startBrowserSpeechFallbackRef.current = startBrowserSpeechFallback;
    }, [startBrowserSpeechFallback]);

    const armNoTranscriptFallbackTimer = useCallback(() => {
        clearNoTranscriptFallbackTimer();
        noTranscriptFallbackTimer.current = setTimeout(() => {
            if (
                phaseRef.current === "listening" &&
                !hasGeminiInputText.current
            ) {
                debugWarn("input_transcription_fallback_triggered");
                setSt((s) => ({
                    ...s,
                    aiMessage: S.ai_no_input_hint,
                }));
                startBrowserSpeechFallback();
            }
        }, 3500);
    }, [clearNoTranscriptFallbackTimer, startBrowserSpeechFallback]);

    const startListeningStack = useCallback(async () => {
        hasGeminiInputText.current = false;
        await startMic();
        armNoTranscriptFallbackTimer();
    }, [startMic, armNoTranscriptFallbackTimer]);

    const stopListeningStack = useCallback(() => {
        stopMic();
        stopBrowserSpeechFallback();
    }, [stopMic, stopBrowserSpeechFallback]);

    const drainAudio = useCallback(async () => {
        if (playing.current) {
            debugLog("audio_queue_drain_skipped", {
                reason: "already_playing",
                queueLength: queue.current.length,
            });
            return;
        }
        debugLog("audio_queue_drain_start", {
            queueLength: queue.current.length,
        });
        playing.current = true;
        while (queue.current.length) {
            let lastPlayback: Promise<void> | null = null;
            while (queue.current.length) {
                const nextChunk = queue.current.shift();
                if (!nextChunk) continue;
                lastPlayback = playTTS(
                    nextChunk.b64,
                    nextChunk.sampleRate,
                );
            }
            if (lastPlayback) {
                await lastPlayback;
            }
        }
        playing.current = false;
        debugLog("audio_queue_drain_done", {
            queueLength: queue.current.length,
            phase: phaseRef.current,
        });
        if (phaseRef.current === "greeting" || phaseRef.current === "asking") {
            setPhase("listening");
            await startListeningStack();
        }
    }, [playTTS, setPhase, startListeningStack]);

    const connect = useCallback(async () => {
        if (connecting.current || gem.current || phaseRef.current !== "idle") {
            debugLog("connect_ignored", {
                connecting: connecting.current,
                hasSession: Boolean(gem.current),
                phase: phaseRef.current,
            });
            return;
        }
        debugLog("connect_attempt", {
            phase: phaseRef.current,
        });
        connecting.current = true;
        closingExpected.current = false;

        const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!key) {
            debugWarn("connect_missing_api_key");
            alert(S.err_key);
            connecting.current = false;
            return;
        }

        let session: GeminiLiveSession;
        try {
            session = new GeminiLiveSession(key);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            debugWarn("connect_constructor_failed", {
                message,
            });
            alert(message);
            connecting.current = false;
            return;
        }
        debugLog("connect_session_created");
        gem.current = session;

        transcriptCommittedRef.current = "";
        transcriptInterimRef.current = "";
        aiCommittedRef.current = "";
        aiInterimRef.current = "";
        hasOutputTranscriptionRef.current = false;

        session.onText = (text) =>
            setSt((s) => {
                const msg = text.replace("EXTRACTION_DONE", "").trim();
                const done = text.includes("EXTRACTION_DONE");
                debugLog("on_text", {
                    done,
                    length: text.length,
                    textPreview: summarizeText(text),
                });
                if (done) phaseRef.current = "complete";

                if (!done && hasOutputTranscriptionRef.current) {
                    return {
                        ...s,
                        fields: extract(s.transcript),
                    };
                }

                return {
                    ...s,
                    phase: done ? "complete" : s.phase,
                    aiMessage: done
                        ? S.ai_complete
                        : msg
                          ? mergeStreamingText(s.aiMessage, msg)
                          : s.aiMessage,
                    fields: extract(s.transcript),
                    missing: done ? [] : s.missing,
                };
            });

        session.onInputTranscription = (text, finished) =>
            setSt((s) => {
                const chunk = text.trim();
                if (!chunk) {
                    return s;
                }
                hasGeminiInputText.current = true;
                clearNoTranscriptFallbackTimer();

                if (finished) {
                    transcriptCommittedRef.current = mergeStreamingText(
                        transcriptCommittedRef.current,
                        chunk,
                    );
                    transcriptInterimRef.current = "";
                } else {
                    transcriptInterimRef.current = chunk;
                }

                const tr = [
                    transcriptCommittedRef.current,
                    transcriptInterimRef.current,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                debugLog("on_input_transcription", {
                    length: chunk.length,
                    finished,
                    textPreview: summarizeText(chunk),
                });
                return {
                    ...s,
                    transcript: tr,
                    fields: extract(tr),
                };
            });

        session.onOutputTranscription = (text, finished) =>
            setSt((s) => {
                const chunk = text.trim();
                if (!chunk) {
                    return s;
                }

                hasOutputTranscriptionRef.current = true;

                if (finished) {
                    aiCommittedRef.current = mergeStreamingText(
                        aiCommittedRef.current,
                        chunk,
                    );
                    aiInterimRef.current = "";
                } else {
                    aiInterimRef.current = chunk;
                }

                const aiMessage = [aiCommittedRef.current, aiInterimRef.current]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                debugLog("on_output_transcription", {
                    length: chunk.length,
                    finished,
                    textPreview: summarizeText(chunk),
                });

                return {
                    ...s,
                    aiMessage: aiMessage || s.aiMessage,
                };
            });

        session.onAudio = (b64, sampleRate) => {
            inboundAudioCount.current += 1;
            if (
                inboundAudioCount.current <= 5 ||
                inboundAudioCount.current % 25 === 0
            ) {
                debugLog("on_audio", {
                    chunkIndex: inboundAudioCount.current,
                    base64Length: b64.length,
                    sampleRate,
                    queueLengthBeforePush: queue.current.length,
                });
            }
            queue.current.push({ b64, sampleRate });
            drainAudio();
        };
        session.onError = (msg) => {
            debugWarn("session_error", {
                message: msg,
            });
            alert(msg);
            setPhase("idle");
        };
        session.onTurnComplete = () => {
            debugLog("session_turn_complete", {
                phase: phaseRef.current,
                queueLength: queue.current.length,
            });
        };
        session.onClose = ({ code, reason, triggeredByClient }) => {
            debugWarn("session_onclose", {
                code,
                reason,
                triggeredByClient,
                phase: phaseRef.current,
            });

            if (triggeredByClient || closingExpected.current) {
                return;
            }

            queue.current = [];
            playing.current = false;
            connecting.current = false;
            gem.current = null;
            stopTTS();
            stopListeningStack();

            if (
                phaseRef.current !== "idle" &&
                phaseRef.current !== "complete"
            ) {
                setPhase("idle");
                alert(
                    `Gemini live session closed unexpectedly (code ${code}). Reason: ${reason || "(none)"}.`,
                );
            }
        };

        try {
            debugLog("connect_awaiting_sdk_connect");
            await session.connect();
        } catch (err) {
            console.error("Gemini connection error:", err);
            debugWarn("connect_failed", {
                error: err instanceof Error ? err.message : String(err),
            });
            alert(
                `${S.err_gemini}\n${err instanceof Error ? err.message : err}`,
            );
            gem.current = null;
            connecting.current = false;
            return;
        }

        connecting.current = false;
        if (session.isAudioOnlyCompatMode()) {
            debugLog("connect_complete_audio_only_mode");
            setPhase("listening");
            setSt((s) => ({
                ...s,
                aiMessage: S.ai_audio_only_hint,
            }));
            await startListeningStack();
            return;
        }

        debugLog("connect_complete_setting_greeting");
        setPhase("greeting");
        setSt((s) => ({ ...s, aiMessage: S.ai_greeting }));
        debugLog("initial_prompt_sending");
        session.sendText(
            "Greet the user warmly and ask them to tell you about themselves. 2 sentences max.",
        );
    }, [
        clearNoTranscriptFallbackTimer,
        drainAudio,
        extract,
        setPhase,
        startListeningStack,
        stopListeningStack,
        stopTTS,
    ]);

    const disconnect = useCallback(() => {
        debugLog("disconnect_requested", {
            hadSession: Boolean(gem.current),
        });
        closingExpected.current = true;
        stopListeningStack();
        gem.current?.close();
        gem.current = null;
        connecting.current = false;
    }, [stopListeningStack]);

    const stopAndAnalyze = useCallback(() => {
        debugLog("stop_and_analyze_requested");
        stopListeningStack();
        setPhase("asking");
        if (gem.current?.isAudioOnlyCompatMode()) {
            gem.current.endAudioStream();
            const transcriptSnippet = summarizeText(transcriptRef.current, 280);
            gem.current.sendRealtimeText(
                transcriptRef.current.trim()
                    ? `User finished speaking. Continue onboarding using the most recent audio context and transcript so far: "${transcriptSnippet}". Ask only for missing fields, or reply with EXTRACTION_DONE if complete.`
                    : "User finished speaking. Continue onboarding using the latest audio input. If audio was unclear, politely ask the user to repeat key details (name, email, phone, location, gender, skills).",
            );
            debugLog("audio_compat_generation_trigger_sent", {
                transcriptLength: transcriptRef.current.length,
                hasTranscript: Boolean(transcriptRef.current.trim()),
            });
            return;
        }
        gem.current?.sendText(
            "[User finished speaking. Ask for anything still missing, or say EXTRACTION_DONE if complete.]",
        );
    }, [setPhase, stopListeningStack]);

    const startListening = useCallback(async () => {
        await startListeningStack();
    }, [startListeningStack]);

    const interrupt = useCallback(() => {
        debugLog("interrupt_requested", {
            queueLength: queue.current.length,
            phase: phaseRef.current,
        });
        stopTTS();
        stopListeningStack();
        queue.current = [];
        playing.current = false;
        setPhase("listening");
    }, [setPhase, stopListeningStack, stopTTS]);

    const reset = useCallback(() => {
        debugLog("reset_requested", {
            phase: phaseRef.current,
            queueLength: queue.current.length,
        });
        stopTTS();
        stopListeningStack();
        queue.current = [];
        playing.current = false;
        transcriptCommittedRef.current = "";
        transcriptInterimRef.current = "";
        aiCommittedRef.current = "";
        aiInterimRef.current = "";
        hasOutputTranscriptionRef.current = false;
        disconnect();
        setSt({
            phase: "idle",
            transcript: "",
            aiMessage: "",
            fields: {},
            missing: [],
        });
    }, [disconnect, stopListeningStack, stopTTS]);

    const reExtract = useCallback(
        (transcript: string) => {
            const fields = extract(transcript);
            debugLog("reextract_requested", {
                transcriptLength: transcript.length,
                extractedKeys: Object.keys(fields),
            });
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
        (t: string) => {
            transcriptCommittedRef.current = t.trim();
            transcriptInterimRef.current = "";
            setSt((s) => ({ ...s, transcript: t }));
        },
        [],
    );

    useEffect(
        () => () => {
            disconnect();
            stopBrowserSpeechFallback();
        },
        [disconnect, stopBrowserSpeechFallback],
    );

    return {
        st,
        setTranscript,
        connect,
        startListening,
        disconnect,
        sendAudioChunk: (b64: string, sampleRate: number) =>
            gem.current?.sendAudio(b64, sampleRate),
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
    const [reExtracting, setReExtracting] = useState(false);

    const profileFileRef = useRef<HTMLInputElement>(null);
    const frontFileRef = useRef<HTMLInputElement>(null);
    const backFileRef = useRef<HTMLInputElement>(null);
    const [micWarning, setMicWarning] = useState("");

    const {
        microphones,
        selectedMicrophoneId,
        setSelectedMicrophoneId,
        refreshMicrophones,
    } = useMicrophoneDevices();

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

    const sendRef = useRef<(b64: string, sampleRate: number) => void>(() => {});
    const {
        start,
        stop,
        playTTS,
        stopTTS,
        primePlayback,
        levels,
        recording,
        speaking,
    } = useAudioPipeline(
        useCallback((b64, sampleRate) => sendRef.current(b64, sampleRate), []),
        selectedMicrophoneId,
        () => {
            setMicWarning("");
            void refreshMicrophones();
        },
        () => {
            setMicWarning(S.mic_no_signal);
        },
    );

    const {
        st,
        setTranscript,
        connect,
        startListening,
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
    const extractedSkills = Array.isArray(extractedFields.skills)
        ? (extractedFields.skills as string[])
        : [];

    const nameValue = name || extractedName;
    const genderValue = gender || extractedGender;
    const emailValue = email || extractedEmail;
    const phoneValue = phone || extractedPhone;
    const locationValue = location || extractedLocation;

    useEffect(() => {
        sendRef.current = sendAudioChunk ?? (() => {});
    }, [sendAudioChunk]);

    const handleFile = (
        type: "profile" | "front" | "back",
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        debugLog("file_selected", {
            type,
            name: file.name,
            size: file.size,
            mimeType: file.type,
        });
        const reader = new FileReader();
        reader.onloadend = () =>
            setPreviews((p) => ({ ...p, [type]: reader.result as string }));
        reader.readAsDataURL(file);
        if (type === "profile") setProfilePicture(file);
        if (type === "front") setLegalIdFront(file);
        if (type === "back") setLegalIdBack(file);
    };

    const toggleMic = async () => {
        debugLog("mic_toggle_clicked", {
            phase,
            recording,
            speaking,
        });
        setMicWarning("");

        const playbackReady = await primePlayback();
        if (!playbackReady) {
            debugWarn("ui_playback_not_unlocked");
            setMicWarning(S.mic_audio_blocked);
        }

        if (phase === "idle") connect();
        else if (
            phase === "greeting" ||
            phase === "asking" ||
            phase === "analyzing"
        )
            interrupt();
        else if (recording) stopAndAnalyze();
        else if (phase !== "complete") await startListening();
    };

    const handleReExtract = () => {
        if (!transcript.trim()) return;
        debugLog("manual_reextract_clicked", {
            transcriptLength: transcript.length,
        });
        setReExtracting(true);
        reExtract(transcript);
        setReExtracting(false);
    };

    const handleSubmit = () => {
        const skillArr = extractedSkills.map((s) => s.trim()).filter(Boolean);
        debugLog("submit_clicked", {
            phase,
            transcriptLength: transcript.length,
            extractedKeys: Object.keys(extractedFields),
            skillCount: skillArr.length,
            hasPassword: Boolean(password),
            hasProfilePicture: Boolean(profilePicture),
            hasLegalFront: Boolean(legalIdFront),
            hasLegalBack: Boolean(legalIdBack),
        });
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

    useEffect(() => {
        debugLog("ui_state_snapshot", {
            phase,
            phaseLabel,
            micLabel,
            recording,
            speaking,
            transcriptLength: transcript.length,
        });
    }, [phase, phaseLabel, micLabel, recording, speaking, transcript]);

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

                    <div className="w-full max-w-xl mb-6 text-left">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {S.mic_source_label}
                            </label>
                            <button
                                type="button"
                                onClick={() => void refreshMicrophones()}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                            >
                                {S.mic_source_refresh}
                            </button>
                        </div>
                        <select
                            value={selectedMicrophoneId}
                            onChange={(e) => {
                                setMicWarning("");
                                setSelectedMicrophoneId(e.target.value);
                            }}
                            disabled={recording}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none disabled:opacity-60"
                        >
                            {!selectedMicrophoneId && (
                                <option value="">{S.mic_source_default}</option>
                            )}
                            {microphones.map((mic) => (
                                <option key={mic.deviceId} value={mic.deviceId}>
                                    {mic.label}
                                </option>
                            ))}
                        </select>
                        {microphones.length === 0 && (
                            <p className="mt-2 text-xs font-bold text-amber-600">
                                {S.mic_source_none}
                            </p>
                        )}
                        {micWarning && (
                            <p className="mt-2 text-xs font-bold text-amber-600">
                                {micWarning}
                            </p>
                        )}
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
