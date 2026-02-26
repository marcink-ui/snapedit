type Handler = (...args: any[]) => void;

export class EventBus {
    private listeners: Map<string, Set<Handler>> = new Map();

    on(event: string, handler: Handler): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }

    off(event: string, handler: Handler): void {
        this.listeners.get(event)?.delete(handler);
    }

    emit(event: string, ...args: any[]): void {
        this.listeners.get(event)?.forEach(handler => {
            try {
                handler(...args);
            } catch (e) {
                console.error(`[EventBus] Error in handler for "${event}":`, e);
            }
        });
    }
}
