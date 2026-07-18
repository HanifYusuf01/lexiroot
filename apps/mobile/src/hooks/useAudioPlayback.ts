import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useOfflineMediaUri } from './useOfflineMediaUri';

interface PlaybackHandle {
  play: () => void;
  stop: () => void;
  isReady: boolean;
  isPlaying: boolean;
  /** Current playback position in seconds. 0 until playback starts. */
  currentTime: number;
  /** Total clip duration in seconds, or 0 until the player has loaded metadata. */
  duration: number;
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
 *
 * Also polls `currentTime` and `duration` while the clip is playing so callers
 * can drive a progress UI synced to the audio (rather than a faked timer).
 */
export function useAudioPlayback(url: string | null | undefined): PlaybackHandle {
  // Prefer a downloaded local copy when one exists so playback works offline
  // (and loads instantly online). Falls back to the remote URL otherwise.
  const cleanUrl = useOfflineMediaUri(url);
  const player = useAudioPlayer(cleanUrl ? { uri: cleanUrl } : null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    void configureAudioModeOnce();
  }, []);

  // Reset progress state if the URL changes (different clip loaded).
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [cleanUrl]);

  // Poll the player while it's active so the UI can mirror playback position
  // and notice when the clip finishes on its own.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      try {
        const d = Number(player.duration) || 0;
        const t = Number(player.currentTime) || 0;
        if (d > 0) setDuration(d);
        setCurrentTime(t);
        if (!player.playing) {
          // Natural end-of-clip: snap progress to full so the bar settles
          // visually, then drop the playing flag.
          if (d > 0) setCurrentTime(d);
          setIsPlaying(false);
        }
      } catch {
        setIsPlaying(false);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, player]);

  return {
    isReady: !!cleanUrl,
    isPlaying,
    currentTime,
    duration,
    play() {
      if (!cleanUrl) return;
      try {
        player.seekTo(0);
        player.play();
        setCurrentTime(0);
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
        // Pausing a player that's already released/stopped can throw; the state
        // reset below is all that matters, so this failure is non-fatal.
      }
      setIsPlaying(false);
    },
  };
}
