import { useCallback, useEffect, useRef, useState } from "react";

export type RecognizerState = "idle" | "listening" | "checking" | "correct" | "incorrect" | "unsupported" | "error";

const LISTEN_TIMEOUT_MS = 6000;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "").trim();
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/**
 * Lets a child say a word out loud and checks whether the browser heard
 * something close enough to the target — used to verify pronunciation
 * rather than just record-and-playback. No backend: everything happens
 * through the browser's built-in speech recognition.
 */
export function useSpeechRecognizer() {
  const [state, setState] = useState<RecognizerState>(() => (getSpeechRecognitionCtor() ? "idle" : "unsupported"));
  const [heardText, setHeardText] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearWatchdog = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearWatchdog();
      recognitionRef.current?.abort();
    };
  }, [clearWatchdog]);

  const listen = useCallback(
    (targetWord: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setState("unsupported");
        return;
      }

      setState("listening");
      setHeardText(null);

      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      clearWatchdog();
      timeoutRef.current = setTimeout(() => recognition.stop(), LISTEN_TIMEOUT_MS);

      recognition.onresult = (event) => {
        clearWatchdog();
        if (!mountedRef.current) return;
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        setHeardText(transcript);
        setState("checking");

        const said = normalize(transcript);
        const target = normalize(targetWord);
        const isMatch = said.length > 0 && (said === target || said.includes(target) || target.includes(said));

        setTimeout(() => {
          if (mountedRef.current) setState(isMatch ? "correct" : "incorrect");
        }, 300);
      };

      recognition.onerror = () => {
        clearWatchdog();
        if (mountedRef.current) setState("error");
      };

      recognition.onend = () => {
        clearWatchdog();
        setState((prev) => (prev === "listening" ? "error" : prev));
      };

      recognition.start();
    },
    [clearWatchdog]
  );

  /**
   * Manually ends the recording early. Unlike abort(), stop() still lets
   * the browser finalize and grade whatever was captured up to this point
   * — it doesn't just throw the recording away.
   */
  const stop = useCallback(() => {
    clearWatchdog();
    if (recognitionRef.current) recognitionRef.current.stop();
  }, [clearWatchdog]);

  const reset = useCallback(() => {
    clearWatchdog();
    recognitionRef.current?.abort();
    setState((prev) => (prev === "unsupported" ? prev : "idle"));
    setHeardText(null);
  }, [clearWatchdog]);

  return { state, heardText, listen, stop, reset };
}
