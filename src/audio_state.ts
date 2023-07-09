declare global {
    interface EventTargetEventMap {
        'playbackStateChange': CustomEvent<PlaybackState>;
    }
}

export type PlaybackState = 'stopped' | 'playing';

interface AudioStateEventMap {
    playbackStateChange: CustomEvent<PlaybackState>;
}

export interface AudioState {
    addEventListener<K extends keyof AudioStateEventMap>(type: K, listener: (this: EventTarget, ev: AudioStateEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof AudioStateEventMap>(type: K, listener: (this: EventTarget, ev: AudioStateEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    dispatchEvent<K extends keyof AudioStateEventMap>(ev: AudioStateEventMap[K]): boolean;
}

export class AudioState extends EventTarget {
    ctx: AudioContext;
    playing: AudioBufferSourceNode | null;

    constructor() {
        super();
        this.ctx = new AudioContext({
            sampleRate: 48000,
        });
        this.playing = null;
    }

    play(buffer: AudioBuffer) {
        this.stop();

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(this.ctx.destination);
        src.onended = () => {
            this.dispatchEvent(new CustomEvent('playbackStateChange', {
                detail: 'stopped',
            }));
        };

        this.dispatchEvent(new CustomEvent('playbackStateChange', {
            detail: 'playing',
        }));
        src.start();

        this.playing = src;
    }

    stop() {
        if (this.playing !== null) {
            this.playing.stop();
            this.playing.disconnect();
            this.playing = null;
        }
    }
}
