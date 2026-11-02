import {useCallback, useEffect, useRef, useState} from 'react';
import {NativeEventEmitter, NativeModules, PermissionsAndroid, Platform} from 'react-native';

// Android SpeechRecognizer wrapper: android/app/src/main/java/com/mimoapp/SpeechModule.kt
const native = NativeModules.BonnieSpeech;

// SpeechRecognizer error codes -> something Mimo can say.
function describeError(code: string): string {
  switch (code) {
    case '6': // ERROR_SPEECH_TIMEOUT
    case '7': // ERROR_NO_MATCH
      return "I didn't catch that. Tap the mic and try again.";
    case '9': // ERROR_INSUFFICIENT_PERMISSIONS
      return 'I need microphone permission to listen.';
    case '2': // ERROR_NETWORK
    case '1': // ERROR_NETWORK_TIMEOUT
    case '12': // ERROR_LANGUAGE_NOT_SUPPORTED
    case '13': // ERROR_LANGUAGE_UNAVAILABLE
      return 'Speech recognition needs an internet connection.';
    case 'unavailable':
      return "This phone doesn't have speech recognition available.";
    default:
      return 'Something went wrong while listening. Try again.';
  }
}

const valueOf = (e: unknown) => (e as {value: string}).value;

/**
 * Press-to-talk speech input. `onResult` gets the final transcript; `partial`
 * holds the live transcript while listening.
 */
export function useSpeech(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!native) {
      return;
    }
    const emitter = new NativeEventEmitter(native);
    const subs = [
      emitter.addListener('onSpeechPartial', e => setPartial(valueOf(e))),
      emitter.addListener('onSpeechResult', e => {
        setListening(false);
        setPartial('');
        const text = valueOf(e);
        if (text) {
          onResultRef.current(text);
        } else {
          setError(describeError('7'));
        }
      }),
      emitter.addListener('onSpeechError', e => {
        setListening(false);
        setPartial('');
        setError(describeError(valueOf(e)));
      }),
    ];
    return () => {
      subs.forEach(s => s.remove());
      native.cancel();
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (Platform.OS !== 'android' || !native) {
      setError('Voice input is only available on Android.');
      return;
    }
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      setError(describeError('9'));
      return;
    }
    setPartial('');
    setListening(true);
    native.start('en-US');
  }, []);

  const stop = useCallback(() => {
    native?.stop();
  }, []);

  /** Stops listening and drops whatever was being heard, without a result. */
  const cancel = useCallback(() => {
    native?.cancel();
    setListening(false);
    setPartial('');
    setError(null);
  }, []);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return {listening, partial, error, start, stop, cancel, toggle};
}
