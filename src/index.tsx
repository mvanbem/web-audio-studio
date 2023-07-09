import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './style.scss';
import { createPresets } from './presets';
import { App } from './app';
import { AudioState } from './audio_state';

const container = document.createElement('div');
container.id = 'container';
document.body.appendChild(container);

const root = createRoot(container);
root.render(
    <App
        audioState={new AudioState()}
        presets={createPresets()}
    />
);
