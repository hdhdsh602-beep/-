export interface OverlayBridgePayload {
  enabled: boolean;
  endpoint: string;
  authToken?: string;
  audioTranslationEnabled?: boolean;
}

declare global {
  interface Window {
    LingoLensAndroid?: {
      setScreenOverlayTranslationEnabled?: (enabled: boolean) => void;
      configureScreenTranslator?: (payloadJson: string) => void;
      requestScreenCapturePermission?: () => void;
      requestAudioCapturePermission?: () => void;
    };
    ReactNativeWebView?: {
      postMessage?: (message: string) => void;
    };
  }
}

export const getDefaultTranslationEndpoint = () => {
  if (typeof window === 'undefined') return '/api/translate';
  return `${window.location.origin}/api/translate`;
};

export const notifyNativeScreenOverlay = (payload: OverlayBridgePayload): boolean => {
  if (typeof window === 'undefined') return false;
  const message = JSON.stringify({ type: 'LINGOLENS_SCREEN_OVERLAY', ...payload });

  let delivered = false;
  if (window.LingoLensAndroid?.configureScreenTranslator) {
    window.LingoLensAndroid.configureScreenTranslator(message);
    delivered = true;
  }
  if (window.LingoLensAndroid?.setScreenOverlayTranslationEnabled) {
    window.LingoLensAndroid.setScreenOverlayTranslationEnabled(payload.enabled);
    delivered = true;
  }
  if (payload.enabled && window.LingoLensAndroid?.requestScreenCapturePermission) {
    window.LingoLensAndroid.requestScreenCapturePermission();
    delivered = true;
  }
  if (payload.enabled && window.LingoLensAndroid?.requestAudioCapturePermission) {
    window.LingoLensAndroid.requestAudioCapturePermission();
    delivered = true;
  }
  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(message);
    delivered = true;
  }

  window.dispatchEvent(new CustomEvent('lingolens-screen-overlay-change', { detail: payload }));
  return delivered;
};
