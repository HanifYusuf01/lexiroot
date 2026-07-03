import { Component, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          <Text style={styles.emoji}>🦜</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Tap below to continue. If this keeps
            happening, please screenshot the details.
          </Text>
          <View style={styles.detailsBox}>
            <Text style={styles.detailsLabel}>Error details</Text>
            <Text style={styles.detailsText}>{error.message || String(error)}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.85}>
            <Text style={styles.buttonLabel}>Try again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
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
  emoji: {
    fontSize: 48,
    textAlign: 'center',
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
