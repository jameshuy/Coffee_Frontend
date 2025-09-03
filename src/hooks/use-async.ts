import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAsyncState<T> {
  data: T | null;
  error: unknown | null;
  isLoading: boolean;
}

export interface UseAsyncOptions<TArgs extends unknown[], TData> {
  immediate?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  deps?: unknown[];
}

export function useAsync<TArgs extends unknown[], TData>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  options: UseAsyncOptions<TArgs, TData> = {}
) {
  const { immediate = false, onSuccess, onError, deps = [] } = options;

  const isMountedRef = useRef(true);
  const [state, setState] = useState<UseAsyncState<TData>>({
    data: null,
    error: null,
    isLoading: false,
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: TArgs) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const result = await asyncFunction(...args);
        if (isMountedRef.current) {
          setState({ data: result, error: null, isLoading: false });
          onSuccess?.(result);
        }
        return result;
      } catch (error) {
        if (isMountedRef.current) {
          setState((s) => ({ ...s, error, isLoading: false }));
          onError?.(error);
        }
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asyncFunction, onSuccess, onError, ...deps]
  );

  useEffect(() => {
    if (immediate) {
      // @ts-expect-error allow call without args when immediate
      execute();
    }
  }, [immediate, execute]);

  return { ...state, execute } as const;
}


