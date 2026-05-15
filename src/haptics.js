// Wrapper para vibración: usa Capacitor Haptics si está corriendo nativo,
// si no cae en navigator.vibrate (Android Chrome) o no hace nada (iOS Safari).

let HapticsAPI = null;
let isNative = false;

(async () => {
  try {
    const cap = await import('@capacitor/core');
    isNative = cap?.Capacitor?.isNativePlatform?.() ?? false;
    if (isNative) {
      HapticsAPI = await import('@capacitor/haptics');
    }
  } catch {
    isNative = false;
  }
})();

export function triggerHaptic(strength = 'light') {
  try {
    if (isNative && HapticsAPI) {
      const { Haptics, ImpactStyle } = HapticsAPI;
      const style =
        strength === 'heavy' ? ImpactStyle.Heavy :
        strength === 'medium' ? ImpactStyle.Medium :
        ImpactStyle.Light;
      Haptics.impact({ style }).catch(() => {});
      return;
    }
  } catch {}
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const ms = strength === 'heavy' ? 90 : strength === 'medium' ? 45 : 18;
    navigator.vibrate(ms);
  }
}
