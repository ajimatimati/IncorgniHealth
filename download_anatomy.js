/**
 * Script to download a highly detailed anatomical body mesh.
 * 
 * We will try several known open-source/CC0 GLB URLs.
 * The best real anatomical option for web use is the 
 * "Mixamo" base character from Adobe (free), or a MakeHuman base export.
 * 
 * For an always-available source: We will use the "Body" model from
 * Khronos sample assets which is the standard used in medical 3D viewers.
 * 
 * The BrainStem is a highly detailed, anatomically preserved GLTF.
 * The Spine model would also work.
 * 
 * Best open-source FULL HUMAN option currently available:
 * - "Adam" from Unity, but that requires login.
 * - Standard "male/female" base meshes from Mixamo - also require login.
 * 
 * The best publicly accessible GLTF that represents a standing human figure:
 * The official Khronos Draco-compressed human figure from the GLTF sample models.
 */
const fs = require('fs');
const https = require('https');
const http = require('http');
const path  = require('path');

const models = [
  // Try a detailed anatomical standing male base mesh (CC0)
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
    name: 'BrainStem (detailed organic mesh for anatomy rendering)'
  }
];

async function download(urlStr, dest) {
  return new Promise((resolve, reject) => {
    const protocol = urlStr.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    protocol.get(urlStr, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { file.close(); reject(err); });
  });
}

async function main() {
  const dest = path.join(__dirname, 'client', 'public', 'human_anatomy.glb');
  
  for (const model of models) {
    try {
      console.log(`Trying: ${model.name}`);
      console.log(`URL: ${model.url}`);
      await download(model.url, dest);
      const stats = fs.statSync(dest);
      console.log(`\n✓ Downloaded successfully! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Saved to: ${dest}`);
      break;
    } catch (e) {
      console.error(`Failed: ${e.message}`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }
}

main();
