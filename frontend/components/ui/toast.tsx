"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
    /** Dedup key — only one toast with this key can be active at a time */
    key?: string;
}

interface ToastOptions {
    type?: ToastType;
    duration?: number;
    /**
     * Dedup key — prevents the same toast from stacking on re-renders.
     * If a toast with this key is already visible, it won't be added again.
     * Omit to allow unlimited duplicates (e.g. for user-triggered actions).
     */
    key?: string;
}

// ─── Global pub-sub store (works outside React) ──────────────────────
type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const activeKeys = new Set<string>();

function emit() {
    listeners.forEach((l) => l([...toasts]));
}

function addToast(item: ToastItem) {
    // Dedup: if a key is set and already active, skip
    if (item.key && activeKeys.has(item.key)) return;
    if (item.key) activeKeys.add(item.key);

    toasts = [...toasts, item];
    emit();
}

function removeToast(id: string) {
    const removed = toasts.find((t) => t.id === id);
    if (removed?.key) activeKeys.delete(removed.key);
    toasts = toasts.filter((t) => t.id !== id);
    emit();
}

function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// ─── Public API — call from anywhere ─────────────────────────────────
let counter = 0;

export function toast(message: string, options?: ToastOptions) {
    const id = `toast-${++counter}-${Date.now()}`;
    addToast({
        id,
        message,
        type: options?.type ?? "info",
        duration: options?.duration ?? 4000,
        key: options?.key,
    });
    return id;
}

toast.success = (message: string, options?: Omit<ToastOptions, "type">) =>
    toast(message, { ...options, type: "success" });

toast.error = (message: string, options?: Omit<ToastOptions, "type">) =>
    toast(message, { ...options, type: "error" });

toast.warning = (message: string, options?: Omit<ToastOptions, "type">) =>
    toast(message, { ...options, type: "warning" });

toast.info = (message: string, options?: Omit<ToastOptions, "type">) =>
    toast(message, { ...options, type: "info" });

// ─── Toast UI component (renders individual toast) ───────────────────
const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
};

function ToastCard({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: string) => void;
}) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(
            () => setIsExiting(true),
            item.duration - 300,
        );
        const removeTimer = setTimeout(() => onDismiss(item.id), item.duration);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [item.id, item.duration, onDismiss]);

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm w-full pointer-events-auto
                ${bgColors[item.type]}
                transition-all duration-300 ease-out
                ${isExiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}`}
        >
            {icons[item.type]}
            <p className="text-sm font-semibold text-zinc-800 flex-1 leading-snug">
                {item.message}
            </p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onDismiss(item.id), 200);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── ToastContainer — mount once in layout ───────────────────────────
export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        return subscribe(setItems);
    }, []);

    const handleDismiss = useCallback((id: string) => {
        removeToast(id);
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {items.map((item) => (
                <ToastCard
                    key={item.id}
                    item={item}
                    onDismiss={handleDismiss}
                />
            ))}
        </div>
    );
}
