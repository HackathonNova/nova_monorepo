/// <reference types="vite/client" />
import type React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        'auto-rotate'?: boolean | string;
        'camera-controls'?: boolean | string;
        'shadow-intensity'?: string;
        exposure?: string;
        ar?: boolean;
        'ar-modes'?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<HTMLElement>;
        onError?: (event: React.SyntheticEvent) => void;
      };
    }
  }
}
