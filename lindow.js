/**
* Originally created by Hafizh
* Recoded by Lindow
**/
const {
   WAConnection,
   MessageType,
   Mimetype,
   WA_MESSAGE_STUB_TYPES,
   ReconnectMode,
   ProxyAgent,
   waChatKey
} = require("@adiwajshing/baileys")
const qrcode = require("qrcode-terminal")
const moment = require("moment-timezone")
const fs = require("fs")
const { color, bgcolor } = require('./lib/color')
const fetch = require('node-fetch')
const { fetchJson } = require('./lib/fetcher')
const { wait, getBuffer, h2k, generateMessageID, getRandom, banner, start, info, success, close } = require('./lib/functions')
const ffmpeg = require('fluent-ffmpeg')
const { removeBackgroundFromImageFile } = require('remove.bg')
const { exec } = require("child_process")
const lindow = new WAConnection()
const time = moment().tz('Asia/Jakarta').format("HH:mm:ss")

lindow.on('qr', qr => {
   qrcode.generate(qr, { small: true })
   console.log(`[ ${time} ] QR code is ready`)
})

lindow.on('credentials-updated', () => {
   const authInfo = lindow.base64EncodedAuthInfo()
   console.log(`credentials updated!`)
   fs.writeFileSync('./session.json', JSON.stringify(authInfo, null, '\t'))
})

fs.existsSync('./session.json') && lindow.loadAuthInfo('./session.json')

lindow.connect();

lindow.on('message-new', async (lin) => {
		try {
			if (!lin.message) return
			if (lin.key && lin.key.remoteJid == 'status@broadcast') return
			const content = JSON.stringify(lin.message)
			const from = lin.key.remoteJid
			const type = Object.keys(lin.message)[0]
			const { text, extendedText, contact, image, video, sticker, document, audio, product } = MessageType
            const isMedia = (type === 'imageMessage' || type === 'videoMessage')
			const isQuotedImage = type === content.includes('imageMessage')
			const isQuotedVideo = type === content.includes('videoMessage')
			const isQuotedSticker = type === content.includes('stickerMessage')
		   // AUTO STICKER
           if (lin.key.fromMe) return
		   var Exif = require(process.cwd() + '/exif.js')
            var exif = new Exif()
            var stickerWm = (media, packname, author) => {
            ran = getRandom('.webp')
            exif.create(packname, author, from.split("@")[0])
            exec(`webpmux -set exif ./temp/${from.split("@")[0]}.exif ./${media} -o ./${ran}`, (err, stderr, stdout) => {
            if (err) return lindow.sendMessage(from, String(err), text, { quoted: lin })
            lindow.sendMessage(from, fs.readFileSync(ran), sticker, {quoted: lin})
        })
    }
    if ((isMedia && !lin.message.videoMessage || isQuotedImage)) {
               var mediaEncrypt = isQuotedImage ? JSON.parse(JSON.stringify(lin).replace('quotedM','m')).message.extendedTextMessage.contextInfo : lin
               var mediaFinalys = await lindow.downloadAndSaveMediaMessage(mediaEncrypt, 'dlstikerwm')
			   var has = 'SLA KKK' // Author Name
			   var kas = '+55 73 8884-3631' // Pack Name
               var packageName = `${has}`
               var packageAuthor = `${kas}`
               var exifName = 'stikerwm.exif',
                   webpName = `${from.split(/@/)[0]}.webp`
               try {
                   exec(`cwebp -q 50 dlstikerwm.jpeg -o ${webpName}`, (e, stderr, stdout) => {
                       if (e) return lindow.sendMessage(from, String(stderr), text)
                           stickerWm(webpName, packageName, packageAuthor)
                   })
               } catch (e) {
                   throw e
               }
           }
	       // FOR VIDEO OR GIF
		   if ((isMedia & !lin.message.imageMessage || isQuotedVideo)) {
						const encmedia = isQuotedVideo ? JSON.parse(JSON.stringify(lin).replace('quotedM','m')).message.extendedTextMessage.contextInfo : lin
						const media = await lindow.downloadAndSaveMediaMessage(encmedia)
						ran = getRandom('.webp')
						await ffmpeg(`./${media}`)
							.inputFormat(media.split('.')[1])
							.on('start', function (cmd) {
								console.log(`Started : ${cmd}`)
							})
							.on('error', function (err) {
								console.log(`Error : ${err}`)
								fs.unlinkSync(media)
								tipe = media.endsWith('.mp4') ? 'video' : 'gif'
								lindow.sendMessage(from, 'error', text)
							})
							.on('end', function () {
								console.log('Finish')
								buff = fs.readFileSync(ran)
								lindow.sendMessage(from, buff, sticker)
								fs.unlinkSync(media)
								fs.unlinkSync(ran)
							})
							.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
							.toFormat('webp')
							.save(ran)
						}
		} catch (e) {
			console.log('Error : %s', color(e, 'red'))
		}
})
