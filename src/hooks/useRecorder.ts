import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "recorded" | "error";

const MAX_DURATION_MS = 5000;
const GET_MEDIA_TIMEOUT_MS = 8000;

const ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: "Ask a grown-up to allow the microphone.",
  PermissionDeniedError: "Ask a grown-up to allow the microphone.",
  NotFoundError: "No microphone was found on this device.",
  TimeoutError: "Couldn't reach the microphone. Try again.",
};

/** getUserMedia can hang indefinitely on some browsers/devices instead of rejecting. */
function getUserMediaWithTimeout(constraints: MediaStreamConstraints, timeoutMs: number): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DOMException("Timed out waiting for the microphone", "TimeoutError")), timeoutMs);
    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        clearTimeout(timer);
        resolve(stream);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Wraps getUserMedia + MediaRecorder so a child can record their own voice
 * and immediately play it back — there's no backend, so recordings only
 * live as an in-memory object URL for the current round and are discarded
 * on reset/unmount.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupStream();
    };
  }, [cleanupStream]);

  const reset = useCallback(() => {
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setErrorMessage(null);
    setState("idle");
    cleanupStream();
  }, [cleanupStream]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Recording isn't supported in this browser.");
      setState("error");
      return;
    }

    setState("requesting");
    setErrorMessage(null);

    try {
      const stream = await getUserMediaWithTimeout({ audio: true }, GET_MEDIA_TIMEOUT_MS);
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (!mountedRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setState("recorded");
        cleanupStream();
      };

      recorder.start();
      setState("recording");
      autoStopTimer.current = setTimeout(() => stop(), MAX_DURATION_MS);
    } catch (err) {
      if (!mountedRef.current) return;
      const name = err instanceof DOMException ? err.name : "";
      setErrorMessage(ERROR_MESSAGES[name] ?? "Couldn't start recording. Try again.");
      setState("error");
      cleanupStream();
    }
  }, [cleanupStream, stop]);

  return { state, audioUrl, errorMessage, start, stop, reset };
}
