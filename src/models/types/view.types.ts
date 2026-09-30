export type UIState = 
  | 'idle' 
  | 'loading' 
  | 'success' 
  | 'error' 
  | 'authenticated' 
  | 'unauthenticated';

export interface ViewState<T = unknown> {
  state: UIState;
  data?: T;
  errorMessage?: string | null;
}
