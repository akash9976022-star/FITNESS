// Ambient type declarations for IDE module resolution when node_modules is not installed locally.

declare namespace JSX {
  interface Element {
    [key: string]: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface ElementChildrenAttribute {
    children: {};
  }
}

declare namespace React {
  type FC<P = Record<string, unknown>> = (props: P) => any;
  type FunctionComponent<P = Record<string, unknown>> = (props: P) => any;
  type ReactNode = any;
  type ReactElement<P = any, T = any> = any;
  type ComponentType<P = any> = any;
  type ChangeEvent<T = any> = any;
  type FormEvent<T = any> = any;
  type MouseEvent<T = any> = any;
  type TouchEvent<T = any> = any;
  type KeyboardEvent<T = any> = any;
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);
  type RefObject<T> = { current: T };
  type MutableRefObject<T> = { current: T };

  function useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  function useState<T = any>(initialState?: any): [T, Dispatch<SetStateAction<T>>];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useRef<T>(initialValue: T): RefObject<T>;
  function useRef<T = any>(initialValue?: any): RefObject<T>;
  function useMemo<T>(factory: () => T, deps?: any[]): T;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
  function createContext<T>(defaultValue: T): any;
  function useContext<T>(context: any): T;
  function useReducer<R extends (...args: any[]) => any>(reducer: R, initialState: any, init?: any): any;

  namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

declare module 'react' {
  export type FC<P = Record<string, unknown>> = React.FC<P>;
  export type FunctionComponent<P = Record<string, unknown>> = React.FunctionComponent<P>;
  export type ReactNode = React.ReactNode;
  export type ReactElement<P = any, T = any> = React.ReactElement<P, T>;
  export type ComponentType<P = any> = React.ComponentType<P>;
  export type ChangeEvent<T = any> = React.ChangeEvent<T>;
  export type FormEvent<T = any> = React.FormEvent<T>;
  export type MouseEvent<T = any> = React.MouseEvent<T>;
  export type TouchEvent<T = any> = React.TouchEvent<T>;
  export type KeyboardEvent<T = any> = React.KeyboardEvent<T>;
  export type Dispatch<A> = React.Dispatch<A>;
  export type SetStateAction<S> = React.SetStateAction<S>;
  export type RefObject<T> = React.RefObject<T>;
  export type MutableRefObject<T> = React.MutableRefObject<T>;

  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  export const useRef: typeof React.useRef;
  export const useMemo: typeof React.useMemo;
  export const useCallback: typeof React.useCallback;
  export const createContext: typeof React.createContext;
  export const useContext: typeof React.useContext;
  export const useReducer: typeof React.useReducer;

  export namespace JSX {
    interface Element extends React.JSX.Element {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }

  const ReactDefault: typeof React & {
    FC: typeof React.FC;
    useState: typeof React.useState;
    useEffect: typeof React.useEffect;
    useRef: typeof React.useRef;
    useMemo: typeof React.useMemo;
    useCallback: typeof React.useCallback;
    createContext: typeof React.createContext;
    useContext: typeof React.useContext;
    useReducer: typeof React.useReducer;
    [key: string]: any;
  };

  export default ReactDefault;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'lucide-react' {
  export type LucideIcon = any;
  export type LucideProps = any;
  export const Activity: any;
  export const AlertCircle: any;
  export const AlertTriangle: any;
  export const ArrowRight: any;
  export const Award: any;
  export const BarChart3: any;
  export const Bell: any;
  export const Bot: any;
  export const Calendar: any;
  export const CalendarCheck: any;
  export const Check: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const ChevronDown: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ChevronUp: any;
  export const Clock: any;
  export const Compass: any;
  export const Droplets: any;
  export const Dumbbell: any;
  export const Edit: any;
  export const Edit2: any;
  export const ExternalLink: any;
  export const Eye: any;
  export const EyeOff: any;
  export const FileText: any;
  export const Filter: any;
  export const Flame: any;
  export const FlipHorizontal: any;
  export const Footprints: any;
  export const Heart: any;
  export const HeartPulse: any;
  export const Info: any;
  export const Layers: any;
  export const Link: any;
  export const Loader2: any;
  export const LogOut: any;
  export const Minus: any;
  export const Moon: any;
  export const Music: any;
  export const Pause: any;
  export const Play: any;
  export const Plus: any;
  export const PlusCircle: any;
  export const RefreshCw: any;
  export const RotateCcw: any;
  export const Search: any;
  export const Send: any;
  export const Settings: any;
  export const Share2: any;
  export const Shield: any;
  export const ShieldAlert: any;
  export const ShieldCheck: any;
  export const SkipForward: any;
  export const Smartphone: any;
  export const Sparkles: any;
  export const Star: any;
  export const Sun: any;
  export const Sunrise: any;
  export const Target: any;
  export const Timer: any;
  export const Trash2: any;
  export const TrendingUp: any;
  export const Upload: any;
  export const User: any;
  export const Utensils: any;
  export const Video: any;
  export const Volume2: any;
  export const VolumeX: any;
  export const Wrench: any;
  export const X: any;
  export const Zap: any;

  const Icon: any;
  export default Icon;
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Link: any;
  export const NavLink: any;
  export const useNavigate: any;
  export const useLocation: any;
  export const useParams: any;
  export const Navigate: any;
  export const Outlet: any;
}

declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(config?: any);
    models: any;
    live: any;
  }
}

declare module '@capacitor/core' {
  export const Capacitor: any;
  export interface PluginListenerHandle {
    remove: () => Promise<void>;
  }
}

declare module '@capacitor/local-notifications' {
  export const LocalNotifications: any;
}

declare module '@codetrix-studio/capacitor-google-auth' {
  export const GoogleAuth: any;
}

declare module 'firebase/app' {
  export const initializeApp: any;
  export const getApps: any;
  export const getApp: any;
  export type FirebaseApp = any;
}

declare module 'firebase/auth' {
  export const getAuth: any;
  export const onAuthStateChanged: any;
  export const signInWithPopup: any;
  export const GoogleAuthProvider: any;
  export const signOut: any;
  export const updateProfile: any;
  export const deleteUser: any;
  export type User = any;
}

declare module 'firebase/firestore' {
  export const getFirestore: any;
  export const doc: any;
  export const setDoc: any;
  export const getDoc: any;
  export const updateDoc: any;
  export const collection: any;
  export const query: any;
  export const where: any;
  export const onSnapshot: any;
  export const deleteDoc: any;
  export const writeBatch: any;
  export const serverTimestamp: any;
  export const getDocs: any;
  export const orderBy: any;
  export const limit: any;
  export type Firestore = any;
  export type DocumentData = any;
  export type Unsubscribe = () => void;
}

declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
  export const deleteObject: any;
  export type FirebaseStorage = any;
}

declare module 'firebase/analytics' {
  export const getAnalytics: any;
}
