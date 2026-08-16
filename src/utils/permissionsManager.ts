/**
 * Permissions Manager Utility
 * Manages device camera, microphone, and media permissions across desktop and mobile.
 * Engineered for Nexus Plex by Lead AI Systems Architect Aarnav.
 */

export interface PermissionStatusResult {
  camera: "granted" | "denied" | "prompt" | "unsupported";
  microphone: "granted" | "denied" | "prompt" | "unsupported";
}

export async function checkMediaPermissions(): Promise<PermissionStatusResult> {
  const result: PermissionStatusResult = {
    camera: "prompt",
    microphone: "prompt",
  };

  if (!navigator?.mediaDevices) {
    result.camera = "unsupported";
    result.microphone = "unsupported";
    return result;
  }

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const camStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
      result.camera = (camStatus.state as any) || "prompt";
    } catch {
      // Permission API name 'camera' might not be supported in all browsers
    }

    try {
      const micStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
      result.microphone = (micStatus.state as any) || "prompt";
    } catch {
      // Permission API name 'microphone' might not be supported in all browsers
    }
  }

  return result;
}

export async function requestCameraAccess(facingMode: "user" | "environment" = "user"): Promise<MediaStream | null> {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error("Camera API is not supported on this browser or device.");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    return stream;
  } catch (err: any) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      throw new Error("Camera access denied. Please allow camera permissions in browser settings.");
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      throw new Error("No camera device found on this system.");
    }
    throw new Error(err.message || "Failed to access device camera.");
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => track.stop());
  } catch (e) {
    console.warn("Failed to stop media track:", e);
  }
}
