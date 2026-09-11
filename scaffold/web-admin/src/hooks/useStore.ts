import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPermission {
  id: string;
  code: string;
  name: string;
  module: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: {
    permission: UserPermission;
  }[];
}

export interface StoreAccess {
  storeId: string;
  role?: string;
  store: UserStore;
}

export interface StoreSettingsLite {
  acceptCash?: boolean;
  acceptCard?: boolean;
  acceptOnlinePayment?: boolean;
  paymentConfigs?: any;
  loyaltyEnabled?: boolean;
  loyaltyPointsPerDollar?: number | string;
  mapsProvider?: string;
  [key: string]: any;
}

export interface UserStore {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  taxRate?: string | number;
  deliveryFee?: string | number;
  companyId?: string;
  settings?: StoreSettingsLite | null;
  operatingHours?: any;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  storeAccess: StoreAccess[];
  avatarUrl?: string;
}

interface StoreState {
  currentStore: UserStore | null;
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setStore: (store: Partial<UserStore> & { id: string; name: string } | null) => void;
  setUser: (user: AuthenticatedUser | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentStore: null,
      user: null,
      token: null,
      isAuthenticated: false,
      setStore: (store) =>
        set({ currentStore: store ? ({ ...(get().currentStore || {}), ...store } as UserStore) : null }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token: token || null, isAuthenticated: !!token && !!get().user });
      },
      logout: () => {
        localStorage.removeItem('token');
        // Reset state first; persist middleware will overwrite restaurant-store with the cleared values.
        set({ currentStore: null, user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'restaurant-store',
      // Only persist the small slice we need — never persist isAuthenticated derived flag.
      partialize: (state) => ({
        currentStore: state.currentStore,
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.user && !!state.token;
        }
      },
    }
  )
);
