/* eslint-disable no-console */
import pkg from 'mongodb';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
// eslint-disable-next-line import/extensions
import { mongoConfig as url, dbName ,ytApiKey} from './config.mjs';

const parser = new Parser();

const { MongoClient } = pkg;

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async function run() {
  let errorCount = 0;
  let cuenta = 0;
  try {
    await client.connect();
    const db = client.db(dbName);
    const agregaVideoAMongo = (videoObj) => db.collection('videos')
      .findOneAndUpdate(
        { _id: videoObj.id },
        { $setOnInsert: videoObj },
        { upsert: true, returnDocument: 'after' },
      );
    const doc = await db.collection('canales').distinct('id', { activo: true });
    const porcanal = (canal, index, upl) => setTimeout(async () => {
      try {
        const ele = await db.collection('videos').distinct('id', { 'snippet.channelId': canal });
        let urlp = 'https://www.youtube.com/feeds/videos.xml?';
        urlp += upl ? `playlist_id=${canal.replace(/^UC/, 'UU')}` : `channel_id=${canal}`;
        const parsed = await parser.parseURL(urlp);
        parsed.items.forEach(async (entry) => {
          const idc = entry.id.slice(9);
          if (!ele.includes(idc)) {
            try {
              console.log(`video nuevo:\n\t${entry.title}\n\t${entry.author}`);
              const infoURL = new URL('https://www.googleapis.com/youtube/v3/videos');
              infoURL.searchParams.append('id', idc);
              infoURL.searchParams.append('key', ytApiKey);
              infoURL.searchParams.append('part', 'contentDetails,snippet,status');
              infoURL.searchParams.append('hl', 'en');
              const resp = await fetch(infoURL);
              const respObj = await resp.json();
              const [videoInfo] = respObj.items;
              if (videoInfo.status.uploadStatus === 'processed' || videoInfo.snippet.liveBroadcastContent === 'none') {
                videoInfo.descargado = false;
                videoInfo.descargando = false;
              } else if (videoInfo.status.uploadStatus === 'uploaded' && videoInfo.snippet.liveBroadcastContent === 'live') {
                // video no descargable
                console.log('descargando livestream!!');
                videoInfo.live = true;
                videoInfo.descargando = false;
              } else {
                videoInfo.descargando = false;
                console.log(`no descargable: ${idc} - ${videoInfo.id}`);
              }
              videoInfo.dateAdded = new Date().toISOString();
              // agregarlo a la base de datos si no esta
              await agregaVideoAMongo(videoInfo);
              console.log(`video ${idc} agregado correctamente`);
            } catch (error) {
              console.log(`error con video ${idc}`);
              console.log(error.message);
            }
          }
        });
        cuenta += 1;
        if (!(cuenta % 3)) {
          const pa = (val, i) => `               ${val}`.slice(-i);
          console.log(`${pa(parsed.items.length, 3)}${pa(cuenta, 10)}${pa(errorCount, 8)} - ${parsed.title}`);
        }
        porcanal(canal, 200, !upl);
      } catch (error) {
        console.log(`error con canal ${canal}`);
        console.log(error.message);
        errorCount += 1;
        porcanal(canal, 15, !upl);
      }
    }, index * 2000);
    doc.forEach((x, y) => porcanal(x, y, true));
  } catch (error) {
    console.log(error);
    console.log('error falta al intentar iniciar el servicio');
  }
}());
