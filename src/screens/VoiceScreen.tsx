import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import MicButton from '../components/MicButton';
import PrimaryButton from '../components/PrimaryButton';
import {BackTitle} from './ScanScreen';
import {useSpeech} from '../speech';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {onBack?: () => void; onDone?: (transcript: string) => Promise<void> | void};

const HEIGHTS = [14, 22, 34, 48, 30, 56, 40, 24, 46, 60, 36, 20, 42, 58, 34, 50, 28, 44, 62, 38, 26, 48, 32, 20, 28, 16];

// Orange for the numbers so amounts stand out in the transcript.
function Transcript({text}: {text: string}) {
  const parts = text.split(/(\d[\d,.]*k?)/gi);
  return (
    <Text style={styles.transcript}>
      {parts.map((p, i) =>
        /^\d/.test(p) ? (
          <Text key={i} style={styles.amount}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

function Bar({height, active, delay}: {height: number; active: boolean; delay: number}) {
  const scale = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(0.35);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {toValue: 1, duration: 500, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(scale, {toValue: 0.35, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay, scale]);

  return <Animated.View style={[styles.wave, {height, transform: [{scaleY: scale}]}]} />;
}

// Figma: 12 Voice input. Each time you stop talking the sentence is appended; tap the mic to add more.
export default function VoiceScreen({onBack, onDone}: Props) {
  const [transcript, setTranscript] = useState('');
  const speech = useSpeech(text => setTranscript(t => (t ? `${t} ${text}` : text)));
  const started = useRef(false);
  const [thinking, setThinking] = useState(false);
  // Throw away a misheard sentence and listen again from scratch.
  const clear = () => {
    speech.cancel();
    setTranscript('');
    speech.start();
  };
  const finish = async () => {
    const text = transcript.trim();
    if (!text || thinking) {
      return;
    }
    if (speech.listening) {
      speech.toggle();
    }
    setThinking(true);
    try {
      await onDone?.(text);
    } finally {
      setThinking(false);
    }
  };

  // Start listening straight away, like the design.
  const {start} = speech;
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      start();
    }
  }, [start]);

  const shown = [transcript, speech.partial].filter(Boolean).join(' ');
  const status = speech.listening ? 'LISTENING' : 'PAUSED';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <BackTitle title="Tell Mimo" onBack={onBack} />

        <View style={styles.body}>
          <BunnySays
            text="I'm listening! Say what you spent, like “450 on lunch and 200 on a rickshaw”."
          />

          <GlassCard radius={22}>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                {speech.listening && <View style={styles.live} />}
                <Text style={styles.status}>{status}</Text>
                {!!shown && !thinking && (
                  <Pressable
                    onPress={clear}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear and speak again"
                    style={styles.clear}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                )}
              </View>
              {shown ? (
                <Transcript text={shown} />
              ) : (
                <Text style={styles.empty}>
                  {speech.error ?? (speech.listening ? 'Go ahead, I’m all ears…' : 'Tap the mic and start talking.')}
                </Text>
              )}
              {!!shown && speech.error && <Text style={styles.error}>{speech.error}</Text>}
            </View>
          </GlassCard>

          <View style={styles.waves}>
            {HEIGHTS.map((h, i) => (
              <Bar key={i} height={h} active={speech.listening} delay={(i * 130) % 1000} />
            ))}
          </View>

          <View style={styles.micWrap}>
            <MicButton
              size={96}
              active={speech.listening}
              onPress={speech.toggle}
              label="Start listening"
            />
            <Text style={styles.hint}>
              {speech.listening ? 'Tap to stop' : 'Tap the mic to keep talking'}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label={thinking ? 'Mimo is sorting it out…' : 'Done, fill it in'}
          onPress={finish}
          disabled={thinking}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  body: {flex: 1, paddingTop: 20, gap: 18},
  card: {minHeight: 140, padding: 18},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  live: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0533A'},
  clear: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: colors.card,
  },
  clearText: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 17},
  status: {color: colors.textSoft, fontFamily: fonts.black, fontSize: 11, letterSpacing: 0.8},
  transcript: {marginTop: 10, color: colors.text, fontFamily: fonts.hand, fontSize: 27, lineHeight: 33},
  amount: {color: '#8F4A30'},
  empty: {marginTop: 12, color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 22, lineHeight: 26},
  error: {marginTop: 10, color: '#8F4A30', fontFamily: fonts.semiBold, fontSize: 12.5},
  waves: {height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5},
  wave: {width: 4, borderRadius: 2, backgroundColor: colors.orange},
  micWrap: {alignItems: 'center', gap: 16, marginTop: 4},
  hint: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 20},
});
