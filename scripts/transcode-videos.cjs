const path = require('path')
const fs = require('fs')
const ffmpegPath = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

const inputDir = path.join(__dirname, '..', 'public', 'videos')
const resolutions = [1080, 720, 480, 360]

function needsTranscode(file) {
  // skip files that look like already transcoded (contain -<digits>.mp4)
  return !/-(?:1080|720|480|360)\.mp4$/i.test(file)
}

async function transcode(file) {
  const filePath = path.join(inputDir, file)
  const ext = path.extname(file)
  const base = path.basename(file, ext)

  for (const res of resolutions) {
    const outName = `${base}-${res}.mp4`
    const outPath = path.join(inputDir, outName)
    if (fs.existsSync(outPath)) {
      console.log(`${outName} already exists, skipping.`)
      continue
    }

    console.log(`Transcoding ${file} -> ${outName} (${res}p)`)
    await new Promise((resolve, reject) => {
      const proc = ffmpeg(filePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate(res >= 720 ? '128k' : '96k')
        .outputOptions(['-preset fast', '-crf ' + (res === 1080 ? 20 : res === 720 ? 22 : res === 480 ? 24 : 26)])
        .size(`?x${res}`)
        .on('error', (err) => {
          console.error('Error transcoding', outName, err.message)
          reject(err)
        })
        .on('end', () => {
          console.log(`Finished ${outName}`)
          resolve()
        })
        .save(outPath)
    })
  }
}

async function main() {
  if (!fs.existsSync(inputDir)) {
    console.error('Input dir not found:', inputDir)
    process.exit(1)
  }

  const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.mp4'))
  const sources = files.filter(needsTranscode)
  if (sources.length === 0) {
    console.log('No source mp4s found to transcode.')
    return
  }

  for (const f of sources) {
    try {
      await transcode(f)
    } catch (e) {
      console.error('Failed to transcode', f, e)
    }
  }

  console.log('All done')
}

main().catch((e) => { console.error(e); process.exit(1) })
