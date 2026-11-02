import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

export type CategoryKey = 'Food' | 'Transport' | 'Shopping' | 'Bills';

export type CategoryInfo = {
  key: CategoryKey;
  label: string;
  bg: string; // icon chip background
  fg: string; // icon / tag text color
  bar: string; // bar + chart color
};

export const CATEGORIES: CategoryInfo[] = [
  {key: 'Food', label: 'Food & drinks', bg: 'rgba(158,85,57,0.14)', fg: '#8F4A30', bar: '#9E5539'},
  {key: 'Transport', label: 'Transport', bg: 'rgba(162,127,69,0.2)', fg: '#6E5426', bar: '#A27F45'},
  {key: 'Shopping', label: 'Shopping', bg: 'rgba(107,84,70,0.14)', fg: '#5B4232', bar: '#6B5446'},
  {key: 'Bills', label: 'Bills', bg: 'rgba(138,148,112,0.22)', fg: '#4F5A3A', bar: '#8A9470'},
];

export const categoryInfo = (key: CategoryKey) => CATEGORIES.find(c => c.key === key)!;

export function CategoryIcon({k, size = 17}: {k: CategoryKey; size?: number}) {
  const stroke = categoryInfo(k).fg;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (k) {
    case 'Food':
      return (
        <Svg {...common}>
          <Path d="M7 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 13v8M17 3c-2 1-3 3-3 6v3h3v9" />
        </Svg>
      );
    case 'Transport':
      return (
        <Svg {...common}>
          <Rect x={5} y={3} width={14} height={14} rx={3} />
          <Path d="M5 10h14M8 21l1-4M16 21l-1-4" />
        </Svg>
      );
    case 'Shopping':
      return (
        <Svg {...common}>
          <Path d="M6 8h12l-1 13H7L6 8zM9 8V6a3 3 0 0 1 6 0v2" />
        </Svg>
      );
    case 'Bills':
      return (
        <Svg {...common}>
          <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </Svg>
      );
  }
}
