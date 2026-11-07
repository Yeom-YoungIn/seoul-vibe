import { createContext, useContext, useEffect } from 'react';

// Tone of the logo, matched to whatever surface sits under the top-left corner of the page.
// 'night' is for pages whose whole top band is ink, where the black menu button would vanish.
export type HeaderTone = 'light' | 'dark' | 'night';

export const HeaderToneContext = createContext<(tone: HeaderTone) => void>(() => {});

export function useHeaderTone(tone: HeaderTone) {
  const setTone = useContext(HeaderToneContext);
  useEffect(() => {
    setTone(tone);
  }, [tone, setTone]);
}
