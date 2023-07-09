import { SoundDesc, setupSound } from './sound_desc';
import { AudioState } from './audio_state';
import { createPinkNoiseBuffer } from './noise';

// Notes on using MediaRecorder to export to WebM.
//
// let streamDst = audio.onlineCtx.createMediaStreamDestination();
// let rec = new MediaRecorder(streamDst.stream, {
//     mimeType: 'audio/webm;codecs=pcm',
// });
//
// // Create a no-op destination node that forwards to the speakers and to the recorder.
// let dst = audio.onlineCtx.createGain();
// dst.gain.value = 1;
// // dst.connect(audio.ctx.destination);
// dst.connect(streamDst);
//
// let blob = new Promise<Blob>((resolve, reject) => {
//     rec.addEventListener('dataavailable', e => {
//         resolve(e.data);
//     });
// });
// rec.start();
//
// () => rec.stop(),

export function renderSound<Params>(audio: AudioState, soundDesc: SoundDesc): Promise<AudioBuffer> {
    let ctx = new OfflineAudioContext({
        numberOfChannels: 1,
        length: 48000 * soundDesc.duration,
        sampleRate: 48000,
    });
    let pinkNoiseBuffer = createPinkNoiseBuffer(ctx);
    setupSound(ctx, pinkNoiseBuffer, soundDesc);
    return ctx.startRendering();
}
