import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

interface PlaybackHandle {
  play: () => void;
  stop: () => void;
  isReady: boolean;
  isPlaying: boolean;
}

let modeConfigured = false;

async function configureAudioModeOnce() {
  if (modeConfigured) return;
  modeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    modeConfigured = false;
  }
}

/**
 * Wraps expo-audio's useAudioPlayer for our exercise + lesson screens. Tapping
 * play always rewinds to the start so a learner can replay the clip without a
 * separate restart control. A null/empty URL returns an inert handle.
 */
export function useAudioPlayback(url: string | null | undefined): PlaybackHandle {
  const cleanUrl = typeof url === 'string' && url.length > 0 ? url : null;
  const player = useAudioPlayer(cleanUrl ? { uri: cleanUrl } : null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    void configureAudioModeOnce();
  }, []);

  // Poll the player's playing state while we believe it's active so the UI
  // glow can clear when the clip finishes on its own.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      try {
        if (!player.playing) setIsPlaying(false);
      } catch {
        setIsPlaying(false);
      }
    }, 200);
    return () => clearInterval(id);
  }, [isPlaying, player]);

  return {
    isReady: !!cleanUrl,
    isPlaying,
    play() {
      if (!cleanUrl) return;
      try {
        player.seekTo(0);
        player.play();
        setIsPlaying(true);
      } catch {
        // swallow — UI doesn't surface playback failures
      }
    },
    stop() {
      if (!cleanUrl) return;
      try {
        player.pause();
      } catch {
        // ignore
      }
      setIsPlaying(false);
    },
  };
}
