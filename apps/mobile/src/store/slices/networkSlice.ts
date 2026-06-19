import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  /** Device reports an active network interface (wifi/cellular). */
  isConnected: boolean;
  /** Device can actually reach the internet (NetInfo's reachability probe). */
  isInternetReachable: boolean;
  /** True once we've received at least one NetInfo update — until then we
   * optimistically assume online so the first render isn't gated on the probe. */
  initialized: boolean;
}

const initialState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  initialized: false,
};

interface NetworkUpdate {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkState(state, action: PayloadAction<NetworkUpdate>) {
      state.isConnected = action.payload.isConnected;
      // NetInfo reports `null` while the reachability probe is in flight — treat
      // that as "reachable if connected" rather than forcing an offline state.
      state.isInternetReachable = action.payload.isInternetReachable ?? action.payload.isConnected;
      state.initialized = true;
    },
  },
});

export const { setNetworkState } = networkSlice.actions;
export default networkSlice.reducer;

export const selectIsOnline = (s: { network: NetworkState }): boolean =>
  s.network.isConnected && s.network.isInternetReachable;
