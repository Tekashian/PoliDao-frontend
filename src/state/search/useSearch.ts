import { useCallback, useSyncExternalStore } from 'react';

type SearchState = { query: string };

let state: SearchState = { query: '' };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot() {
	return state;
}

function setQueryInternal(query: string) {
	const q = query.trim();
	state = { ...state, query: q };
	for (const l of listeners) l();
}

export function useSearch() {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	const setQuery = useCallback((q: string) => setQueryInternal(q), []);
	const clear = useCallback(() => setQueryInternal(''), []);
	return { query: snapshot.query, setQuery, clear };
}
