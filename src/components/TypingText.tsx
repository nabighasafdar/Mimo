import React, {useEffect, useState} from 'react';
import {StyleProp, Text, TextStyle} from 'react-native';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait before the first character. */
  delay?: number;
};

// Types `text` out one character at a time. The untyped remainder is rendered
// transparent, so the bubble keeps its final size and wrapping while it types.
export default function TypingText({text, style, speed = 28, delay = 250}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        setCount(c => {
          if (c + 1 >= text.length && timer) {
            clearInterval(timer);
          }
          return c + 1;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [text, speed, delay]);

  return (
    <Text style={style} accessibilityLabel={text}>
      {text.slice(0, count)}
      <Text style={{opacity: 0}}>{text.slice(count)}</Text>
    </Text>
  );
}
