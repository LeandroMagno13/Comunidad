import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

interface AppState {
  user: UserProfile | null;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_NOTIFICATIONS': {
      const unreadCount = action.payload.filter((n) => !n.readAt).length;
      return { ...state, notifications: action.payload, unreadCount };
    }
    case 'MARK_AS_READ': {
      const notifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, readAt: new Date().toISOString() } : n
      );
      const unreadCount = notifications.filter((n) => !n.readAt).length;
      return { ...state, notifications, unreadCount };
    }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setUser: (user: UserProfile | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('comunidad-storage');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) dispatch({ type: 'SET_USER', payload: parsed.user });
        if (parsed.notifications) dispatch({ type: 'SET_NOTIFICATIONS', payload: parsed.notifications });
      }
    } catch (error) {
      console.error('Error cargando estado guardado:', error);
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    try {
      const toSave = {
        user: state.user,
        notifications: state.notifications,
      };
      localStorage.setItem('comunidad-storage', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error guardando estado:', error);
    }
  }, [state.user, state.notifications]);

  const setUser = (user: UserProfile | null) => dispatch({ type: 'SET_USER', payload: user });
  const setNotifications = (notifications: Notification[]) => dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  const markAsRead = (id: string) => dispatch({ type: 'MARK_AS_READ', payload: id });
  const logout = () => {
    localStorage.removeItem('comunidad-storage');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, setUser, setNotifications, markAsRead, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore debe usarse dentro de AppProvider');
  }
  return context;
}
