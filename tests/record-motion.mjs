// Optional local review recording, encoded by Chrome's native MediaRecorder.
// Captures a fresh test context, never the user's browser or desktop.
import { writeFile } from 'node:fs/promises';
import { connectBrowser, delay } from './cdp.mjs';

const browser = await connectBrowser(), context = await browser.context();
try {
  const page = await context.page(1280, 900);
  await page.goto();
  const encoder = await context.page(1280, 900);
  await encoder.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 900;
    const stream = canvas.captureStream(0);
    window.recordingCanvas = canvas;
    window.recordingTrack = stream.getVideoTracks()[0];
    window.recordingChunks = [];
    window.recording = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2500000 });
    recording.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
    window.recordingDone = new Promise(resolve => {
      recording.onstop = () => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(new Blob(recordingChunks, { type: 'video/webm' }));
      };
    });
    recording.start(250);
  });
  await page.call('Page.bringToFront');
  async function capture(ms) {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      const start = Date.now();
      const { data } = await page.call('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: false });
      await encoder.evaluate(async data => {
        const bitmap = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + data)).blob());
        recordingCanvas.getContext('2d').drawImage(bitmap, 0, 0);
        bitmap.close(); recordingTrack.requestFrame();
      }, data);
      await delay(Math.max(0, 50 - (Date.now() - start)));
    }
  }
  await capture(7500);
  await page.seedAccount();
  await page.evaluate(() => { location.hash = '/'; });
  await capture(7000);
  await encoder.evaluate(() => recording.stop());
  const video = await encoder.evaluate(() => recordingDone);
  await writeFile('artifacts/ui-review/motion-preview.webm', Buffer.from(video, 'base64'));
  if (page.errors.length || page.failedRequests.length) throw new Error(JSON.stringify({ errors: page.errors, requests: page.failedRequests }));
  console.log('Recorded isolated login slideshow and Home carousel: artifacts/ui-review/motion-preview.webm');
} finally { await context.close(); browser.close(); }
