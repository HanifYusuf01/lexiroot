import { Component, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MascotSadIcon } from '../icons/MascotSadIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';

/**
 * Root error boundary + global JS error trap.
 *
 * In a release APK an unhandled JS error is fatal ("LexiRoot keeps stopping"),
 * whereas the same error in a dev build is just a recoverable red-box — which is
 * why crashes reproduce for testers but not locally. This component:
 *   1. Catches render/lifecycle errors (React error boundary).
 *   2. Traps errors thrown outside the React tree — async callbacks, the ~60s
 *      NetInfo reachability tick, unhandled rejections — via ErrorUtils, so they
 *      surface here instead of killing the process.
 * It shows the actual error message so a tester can screenshot the real cause,
 * and offers a reset instead of a hard crash. Remove or gate behind __DEV__ once
 * the underlying crash is fixed if you'd rather fail loudly again.
 */

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler?: () => GlobalHandler;
  setGlobalHandler?: (handler: GlobalHandler) => void;
}

let activeListener: ((error: Error) => void) | null = null;
let installed = false;

/**
 * Route otherwise-fatal global JS errors to the mounted boundary. Installed once
 * per JS runtime. If no boundary is mounted yet, we defer to the previous
 * handler so early-boot crashes still report normally.
 */
function installGlobalHandler(): void {
  if (installed) return;
  const errorUtils = (global as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler) return;
  installed = true;
  const previous = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (activeListener) {
      activeListener(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    previous?.(error, isFatal);
  });
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount(): void {
    installGlobalHandler();
    activeListener = (error) => {
      // Only replace an existing error if we don't already have one on screen,
      // so the first (root) error stays visible rather than being churned by
      // follow-on failures.
      this.setState((prev) => (prev.error ? prev : { error }));
    };
  }

  componentWillUnmount(): void {
    activeListener = null;
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* The app's own mascot, not the 🦜 emoji it used to render — that
              one is a different bird in a different palette on every platform,
              and a crash screen is the worst place to look like someone else's
              app. Sad variant, the same one the lesson-failure screen uses. */}
          <View style={styles.mascot}>
            <MascotSadIcon size={72} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Tap below to continue. If this keeps
            happening, please screenshot the details.
          </Text>
          <View style={styles.detailsBox}>
            <Text style={styles.detailsLabel}>Error details</Text>
            <Text style={styles.detailsText}>{error.message || String(error)}</Text>
            {/* The message alone rarely identifies the cause — "right operand
                of 'in' is not an object" is true of every such check in the
                bundle. These few frames are what turn a screenshot into a
                location, and this boundary also catches errors thrown outside
                the React tree, where there is no component stack to fall back
                on. Trimmed because the full trace is minified and endless. */}
            {topFrames(error) ? (
              <Text style={styles.detailsStack}>{topFrames(error)}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.85}>
            <Text style={styles.buttonLabel}>Try again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

/** The first few stack frames, if the error carries a usable stack. */
function topFrames(error: Error): string | null {
  const stack = typeof error.stack === 'string' ? error.stack : '';
  const frames = stack
    .split('\n')
    .map((line) => line.trim())
    // Drop the leading "TypeError: message" line — it repeats what is already
    // shown above it.
    .filter((line) => line.startsWith('at '))
    .slice(0, 4);
  return frames.length ? frames.join('\n') : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mascot: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  detailsBox: {
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  detailsLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.errorStrong,
    marginBottom: spacing.xs,
  },
  detailsText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutral,
  },
  detailsStack: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.neutralVariant,
    marginTop: 8,
    lineHeight: 15,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
});
