export function encodeWav(audioBuffer: AudioBuffer) {
    if (audioBuffer.numberOfChannels != 1) {
        throw new Error('only one channel is supported');
    }

    const fileSize = 2 * audioBuffer.length + 44;
    const dataBuffer = new ArrayBuffer(fileSize);
    const dataView = new DataView(dataBuffer);

    let offset = 0;
    function writeU32(value: number) {
        dataView.setUint32(offset, value, true);
        offset += 4;
    }
    function writeU16(value: number) {
        dataView.setUint16(offset, value, true);
        offset += 2;
    }
    function writeI16(value: number) {
        dataView.setInt16(offset, value, true);
        offset += 2;
    }

    // RIFF header.
    writeU32(0x46464952); // "RIFF"
    writeU32(fileSize - 8);
    writeU32(0x45564157); // "WAVE"

    // Format chunk.
    writeU32(0x20746d66); // "fmt "
    writeU32(16); // Chunk length
    writeU16(1); // PCM
    writeU16(1); // Channel count
    writeU32(audioBuffer.sampleRate);
    writeU32(2 * audioBuffer.sampleRate); // Byte rate
    writeU16(2); // Block alignment
    writeU16(16); // Sample bit depth

    // Data chunk.
    writeU32(0x61746164); // "data"
    writeU32(2 * audioBuffer.length);

    const data = audioBuffer.getChannelData(0);
    for (let i = 0; i < data.length; ++i) {
        writeI16(Math.min(Math.max(
            // TODO: Dither?
            (data[i] * 32767 + 0.5) | 0,
            -32768), 32767));
    }

    return new Blob([dataBuffer], { type: 'audio/wav' });
}
