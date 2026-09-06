/**
 * Imports every endpoint module for its side effects.
 *
 * `injectEndpoints` runs when a service module is first imported, and screens
 * import their own — so on a cold start only the handful reachable from the
 * root layout are registered. Rehydration happens before most screens mount,
 * which meant the persisted cache could reference endpoints that did not exist
 * yet. Registering them all up front keeps that cache usable instead of being
 * discarded, and makes the set of known endpoints deterministic rather than a
 * function of which screen happened to load first.
 *
 * Import this once, from the store.
 */
import './authApi';
import './culturalContentApi';
import './devicesApi';
import './familyApi';
import './feedbackApi';
import './friendsApi';
import './gamificationApi';
import './languagesApi';
import './leaderboardApi';
import './lessonsApi';
import './progressApi';
import './settingsApi';
import './subscriptionPlansApi';
import './subscriptionsApi';
