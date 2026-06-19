import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { lessonsApi } from '../services/lessonsApi';
import { collectMediaUrls, downloadMedia } from '../services/mediaCache';
import {
  addMedia,
  selectLessonDownload,
  setLessonReady,
  setLessonStatus,
  type DownloadStatus,
} from '../store/slices/downloadsSlice';

/**
 * Downloads one lesson for offline use: pins its JSON in the RTK Query cache
 * (which redux-persist then writes to disk) and pulls every audio/image file
 * down via the media cache. Idempotent and safe to re-run — finished files are
 * skipped. Returns a `download(lessonIds)` callback that processes a whole
 * level's worth of sub-lessons sequentially.
 */
export function useDownloadLesson() {
  const dispatch = useAppDispatch();

  const downloadOne = useCallback(
    async (lessonId: string): Promise<void> => {
      dispatch(setLessonStatus({ lessonId, status: 'downloading' }));
      try {
        // forceRefetch ensures we capture the freshest content; the high
        // keepUnusedDataFor on these endpoints keeps it cached for offline use.
        const lesson = await dispatch(
          lessonsApi.endpoints.getLesson.initiate(lessonId, { forceRefetch: true }),
        ).unwrap();
        const entries = await dispatch(
          lessonsApi.endpoints.listEntries.initiate(lessonId, { forceRefetch: true }),
        ).unwrap();
        const exercises = await dispatch(
          lessonsApi.endpoints.listExercises.initiate(lessonId, { forceRefetch: true }),
        ).unwrap();

        const urls = collectMediaUrls(lesson, entries, exercises);
        for (const url of urls) {
          const localUri = await downloadMedia(url);
          dispatch(addMedia({ url, localUri }));
        }
        dispatch(setLessonReady({ lessonId, mediaCount: urls.length }));
      } catch (err) {
        dispatch(
          setLessonStatus({
            lessonId,
            status: 'error',
            error: err instanceof Error ? err.message : 'Download failed',
          }),
        );
        throw err;
      }
    },
    [dispatch],
  );

  return useCallback(
    async (lessonIds: string[]): Promise<void> => {
      for (const id of lessonIds) {
        await downloadOne(id);
      }
    },
    [downloadOne],
  );
}

/**
 * Aggregates the download state of a group of sub-lessons (a level) into a
 * single status for the UI: `ready` only when every sub is downloaded.
 */
export function useGroupDownloadStatus(lessonIds: string[]): DownloadStatus {
  return useAppSelector((s) => {
    if (lessonIds.length === 0) return 'idle';
    const states = lessonIds.map((id) => selectLessonDownload(s, id)?.status ?? 'idle');
    if (states.some((st) => st === 'downloading')) return 'downloading';
    if (states.some((st) => st === 'error')) return 'error';
    if (states.every((st) => st === 'ready')) return 'ready';
    return 'idle';
  });
}
