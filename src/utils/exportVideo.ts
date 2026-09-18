/**
 * Export canvas stream to Video (WebM / MP4)
 */

export interface VideoExportOptions {
  durationSeconds: number;
  fps: number;
  preferTransparent?: boolean;
  onProgress?: (progress: number) => void;
  /**
   * Live audio track to mux into the recording (from AudioAnalyzerEngine.getExportAudioTrack()).
   * `canvas.captureStream()` only ever captures video — it never includes audio on its own — so
   * this must be added explicitly. Omit/undefined when no audio source is active; the export then
   * proceeds as video-only and `VideoExportResult.hasAudio` reports that honestly (item 13) rather
   * than silently producing a file that claims to have audio it doesn't.
   */
  audioTrack?: MediaStreamTrack | null;
}

export interface VideoExportResult {
  blob: Blob;
  hasAudio: boolean;
}

export function recordCanvasVideo(
  canvas: HTMLCanvasElement,
  options: VideoExportOptions
): Promise<VideoExportResult> {
  return new Promise((resolve, reject) => {
    const { durationSeconds, fps, preferTransparent, onProgress, audioTrack } = options;

    const stream = canvas.captureStream(fps);
    let hasAudio = false;
    if (audioTrack) {
      try {
        stream.addTrack(audioTrack);
        hasAudio = true;
      } catch (err) {
        console.warn('Could not attach audio track to video export — recording video only:', err);
        hasAudio = false;
      }
    }

    // Try supported mime types
    const mimeTypes = preferTransparent
      ? [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4'
        ]
      : [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm'
        ];

    let selectedMimeType = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMimeType = mime;
        break;
      }
    }

    if (!selectedMimeType) {
      reject(new Error('MediaRecorder video encoding is not supported in this browser environment.'));
      return;
    }

    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps high quality
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const startTime = Date.now();
    const durationMs = durationSeconds * 1000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      if (onProgress) {
        onProgress(progress);
      }

      if (elapsed >= durationMs) {
        clearInterval(progressInterval);
        mediaRecorder.stop();
      }
    }, 100);

    mediaRecorder.onstop = () => {
      clearInterval(progressInterval);
      const blob = new Blob(chunks, { type: selectedMimeType });
      resolve({ blob, hasAudio });
    };

    mediaRecorder.onerror = (err) => {
      clearInterval(progressInterval);
      reject(err);
    };

    mediaRecorder.start(100); // chunk every 100ms
  });
}

export function downloadVideoBlob(blob: Blob, filename = 'halftone-kinetic-typography.mp4') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const extension = blob.type.includes('mp4') ? '.mp4' : '.webm';
  const cleanName = filename.endsWith('.mp4') || filename.endsWith('.webm') ? filename : filename + extension;
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
