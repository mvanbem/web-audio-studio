import * as React from 'react';
import prettyBytes from 'pretty-bytes';
import { encodeWav } from './wav';
import { SoundDesc } from './sound_desc';
import { renderSound } from './render';
import { AudioState, PlaybackState } from './audio_state';
import { SoundEditor } from './sound_editor';

export function App({ audioState, presets }: { audioState: AudioState; presets: SoundDesc[]; }) {
    const [sound, setSound] = React.useState(presets[0]);
    const [fileName, setFileName] = React.useState('');

    return (
        <div className='app'>
            <PresetSelector
                presets={presets}
                onLoad={setSound}
            />
            <SoundEditor
                sound={sound}
                onChange={setSound}
            />
            <RenderBar
                audioState={audioState}
                soundDesc={sound}
                fileName={fileName}
                onFileNameChange={setFileName}
            />
        </div>
    );
}

function PresetSelector({ presets, onLoad }: {
    presets: SoundDesc[];
    onLoad: (value: SoundDesc) => void;
}) {
    const [presetIndex, setPresetIndex] = React.useState(0);

    let options = presets.map((preset, index) => <option key={index} value={index}>
        {preset.name}
    </option>
    );

    return (
        <div className='preset-selector'>
            <div className='title'>Preset</div>
            <select
                value={presetIndex}
                onChange={e => setPresetIndex(e.target.selectedIndex)}
            >{options}</select>
            <button
                disabled={presetIndex == -1}
                onClick={() => onLoad(presets[presetIndex])}
            >Load</button>
        </div>
    );
}

function RenderBar({
    audioState, soundDesc, fileName, onFileNameChange,
}: {
    audioState: AudioState;
    soundDesc: SoundDesc;
    fileName: string;
    onFileNameChange: (value: string) => void;
}) {
    const [playbackState, setPlaybackState] = React.useState<PlaybackState>('stopped');
    const [autoplay, setAutoplay] = React.useState(true);
    const [recording, setRecording] = React.useState<AudioBuffer | null>(null);

    React.useEffect(() => {
        let ignore = false;

        setRecording(null);
        (async () => {
            const buffer = await renderSound(audioState, soundDesc);
            if (!ignore) {
                setRecording(buffer);
                if (autoplay) {
                    audioState.play(buffer);
                }
            }
        })()
            .catch(console.error);

        return () => {
            ignore = true;
        };
    }, [audioState, soundDesc]);

    React.useEffect(() => {
        function handlePlaybackStateChange(e: CustomEvent<PlaybackState>) {
            setPlaybackState(e.detail);
        }

        audioState.addEventListener('playbackStateChange', handlePlaybackStateChange);
        return () => { audioState.removeEventListener('playbackStateChange', handlePlaybackStateChange); };
    }, [audioState]);

    return (
        <div className='render-bar'>
            <div className='title'>Render</div>
            <label>
                <input type='checkbox' checked disabled />
                Auto
            </label>
            <button disabled>Render</button>
            <div>
                {recording === null ? (
                    <>Rendering...</>
                ) : (
                    <>Ready ({prettyBytes(recording.length)})</>
                )}
            </div>

            <div className='expand'></div>

            <div className='title'>Playback</div>
            <label>
                <input
                    type='checkbox'
                    checked={autoplay}
                    onChange={e => {
                        setAutoplay(e.target.checked);
                        if (e.target.checked && recording !== null) {
                            audioState.play(recording);
                        }
                    }}
                />
                Auto
            </label>
            <button
                disabled={recording === null}
                onClick={() => { audioState.play(recording!); }}
            >Play</button>
            <button
                disabled={recording === null || playbackState != 'playing'}
                onClick={() => { audioState.stop(); }}
            >Stop</button>

            <div className='expand'></div>

            <div className='title'>Export</div>
            <label>
                <input
                    type='text'
                    placeholder={soundDesc.name}
                    onChange={e => onFileNameChange(e.target.value)}
                />
                .wav
            </label>
            <button
                disabled={recording === null}
                onClick={() => {
                    let blob = encodeWav(recording!);
                    let url = URL.createObjectURL(blob);
                    let anchor = document.createElement('a');
                    anchor.href = url;
                    let baseName = fileName.length > 0 ? fileName : soundDesc.name;
                    anchor.download = baseName + '.wav';
                    anchor.onclick = () => {
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                        }, 150);
                    };
                    anchor.click();
                }}
            >Download</button>
        </div>
    );
}
