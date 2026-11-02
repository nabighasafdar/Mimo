import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {colors} from '../theme';

const base = {
  fill: 'none',
  stroke: colors.textMuted,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const MailIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Rect x={3} y={5} width={18} height={14} rx={3} {...base} />
    <Path d="M4 7l8 6 8-6" {...base} />
  </Svg>
);

export const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Rect x={5} y={11} width={14} height={10} rx={2.5} {...base} />
    <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...base} />
  </Svg>
);

export const EyeIcon = ({off}: {off?: boolean}) => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...base} />
    <Circle cx={12} cy={12} r={3} {...base} />
    {off && <Path d="M4 4l16 16" {...base} />}
  </Svg>
);

export const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <Path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <Path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <Path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </Svg>
);
