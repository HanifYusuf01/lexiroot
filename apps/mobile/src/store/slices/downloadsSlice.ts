import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

interface LessonDownload {
  status: DownloadStatus;
  /** Number of media files associated with the lesson (0 until known). */
  mediaCount: number;
  error?: string;
  updatedAt: string;
}

interface DownloadsState {
  /** Per-lesson download status, keyed by lessonId. */
  lessons: Record<string, LessonDownload>;
  /** remoteUrl → local file:// URI for every downloaded media file. */
  media: Record<string, string>;
}

const initialState: DownloadsState = {
  lessons: {},
  media: {},
};

const downloadsSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    setLessonStatus(
      state,
      action: PayloadAction<{ lessonId: string; status: DownloadStatus; error?: string }>,
    ) {
      const { lessonId, status, error } = action.payload;
      const prev = state.lessons[lessonId];
      state.lessons[lessonId] = {
        status,
        error,
        mediaCount: prev?.mediaCount ?? 0,
        updatedAt: new Date().toISOString(),
      };
    },
    setLessonReady(state, action: PayloadAction<{ lessonId: string; mediaCount: number }>) {
      const { lessonId, mediaCount } = action.payload;
      state.lessons[lessonId] = {
        status: 'ready',
        mediaCount,
        updatedAt: new Date().toISOString(),
      };
    },
    addMedia(state, action: PayloadAction<{ url: string; localUri: string }>) {
      state.media[action.payload.url] = action.payload.localUri;
    },
    removeLesson(state, action: PayloadAction<{ lessonId: string }>) {
      delete state.lessons[action.payload.lessonId];
    },
    clearDownloads(state) {
      state.lessons = {};
      state.media = {};
    },
  },
});

export const { setLessonStatus, setLessonReady, addMedia, removeLesson, clearDownloads } =
  downloadsSlice.actions;
export default downloadsSlice.reducer;

interface DownloadsStateSlice {
  downloads: DownloadsState;
}

export const selectLessonDownload = (s: DownloadsStateSlice, lessonId: string) =>
  s.downloads.lessons[lessonId];

export const selectLocalMediaUri = (s: DownloadsStateSlice, url: string): string | null =>
  s.downloads.media[url] ?? null;
