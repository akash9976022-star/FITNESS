// Ambient type declarations for IDE module resolution when node_modules is not installed locally.

declare module 'react' {
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useMemo: any;
  export const useCallback: any;
  export const createContext: any;
  export const useContext: any;
  export type FC<P = Record<string, unknown>> = any;
  export type ReactNode = any;
  export type ChangeEvent<T = any> = any;
  export type FormEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type ComponentType<P = any> = any;
  export type Dispatch<A> = any;
  export type SetStateAction<S> = any;
  export type RefObject<T> = any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'lucide-react' {
  const Icon: any;
  export default Icon;
  export const Sparkles: any;
  export const Volume2: any;
  export const VolumeX: any;
  export const Play: any;
  export const Pause: any;
  export const SkipForward: any;
  export const X: any;
  export const Music: any;
  export const CheckCircle2: any;
  export const Heart: any;
  export const ChevronRight: any;
  export const Flame: any;
  export const Dumbbell: any;
  export const Compass: any;
  export const Clock: any;
  export const Calendar: any;
  export const Droplets: any;
  export const ExternalLink: any;
  export const Bell: any;
  export const Video: any;
  export const Plus: any;
  export const Trash2: any;
  export const Link: any;
  export const Upload: any;
  export const Settings: any;
  export const User: any;
  export const LogOut: any;
  export const ChevronLeft: any;
  export const ChevronDown: any;
  export const ChevronUp: any;
  export const Check: any;
  export const AlertCircle: any;
  export const Info: any;
  export const RefreshCw: any;
  export const Search: any;
  export const Filter: any;
  export const Edit: any;
  export const Eye: any;
  export const EyeOff: any;
  export const Shield: any;
  export const Zap: any;
  export const Award: any;
  export const Target: any;
  export const Activity: any;
  export const BarChart3: any;
  export const TrendingUp: any;
  export const Sunrise: any;
  export const Moon: any;
  export const Sun: any;
  export type LucideIcon = any;
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
}

declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
  export const deleteObject: any;
  export type FirebaseStorage = any;
  [key: string]: any;
}

declare module 'firebase/analytics' {
  export const getAnalytics: any;
  [key: string]: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
