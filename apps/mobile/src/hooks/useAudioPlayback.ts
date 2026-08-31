import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useOfflineMediaUri } from './useOfflineMediaUri';

/**
 * Half speed. Slow enough to separate Yoruba tones and consonant clusters,
 * without the clip dragging so much that the word stops sounding like itself.
 */
export const SLOW_PLAYBACK_RATE = 0.5;
const NORMAL_PLAYBACK_RATE = 1;

interface PlaybackHandle {
  play: () => void;
  /** Replay the clip at SLOW_PLAYBACK_RATE, pitch preserved. */
  playSlow: () => void;
  stop: () => void;
  isReady: boolean;
  isPlaying: boolean;
  /** True while the current playback is the slowed one — for toggling UI. */
  isPlayingSlow: boolean;
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
  const [rate, setRate] = useState(NORMAL_PLAYBACK_RATE);
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
    setRate(NORMAL_PLAYBACK_RATE);
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

  // Both play paths share this: rewind, set the rate, go. Rate is applied on
  // every start rather than once, because the player is reused across normal
  // and slow replays and would otherwise keep whichever rate ran last.
  function start(nextRate: number) {
    if (!cleanUrl) return;
    try {
      player.seekTo(0);
      // Without pitch correction a half-speed clip drops an octave and stops
      // being a usable pronunciation model — the whole point of slow playback.
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(nextRate, 'high');
      player.play();
      setCurrentTime(0);
      setRate(nextRate);
      setIsPlaying(true);
    } catch {
      // swallow — UI doesn't surface playback failures
    }
  }

  return {
    isReady: !!cleanUrl,
    isPlaying,
    isPlayingSlow: isPlaying && rate < NORMAL_PLAYBACK_RATE,
    currentTime,
    duration,
    play() {
      start(NORMAL_PLAYBACK_RATE);
    },
    playSlow() {
      start(SLOW_PLAYBACK_RATE);
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
