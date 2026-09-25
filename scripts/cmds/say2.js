const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "say2",
    aliases: ["say", "tts"],
    version: "3.0",
    author: "Samir Œ x Sajib",
    countDown: 5,
    role: 0,
    category: "tts",

    description: "🎀 Convert your text into Aizen or Momoi voice.",

    guide: {
      en:
        "{pn} <text>\n" +
        "{pn} <text> --v aizen\n" +
        "{pn} <text> --v momoi\n" +
        "↳ You can also reply to a message."
    }
  },

  onStart: async function ({ message, args, event }) {

    const { getPrefix } = global.utils || {};
    const prefix = typeof getPrefix === "function" ? getPrefix(event.threadID) : "/";

    // ==========================================
    // 🎀 GET TEXT
    // ==========================================

    let text = "";

    if (
      event.type === "message_reply" &&
      event.messageReply?.body
    ) {
      text = event.messageReply.body;
    } else {
      text = args.join(" ");
    }

    text = String(text || "").trim();

    // ==========================================
    // 🗣 VOICE
    // ==========================================

    let voice = "aizen";

    const voiceMatch = text.match(
      /(?:--v|--voice)\s+(aizen|momoi)\s*$/i
    );

    if (voiceMatch) {
      voice = voiceMatch[1].toLowerCase();

      text = text
        .replace(
          /(?:--v|--voice)\s+(aizen|momoi)\s*$/i,
          ""
        )
        .trim();
    }

    // ==========================================
    // ❌ EMPTY TEXT
    // ==========================================

    if (!text) {
      return message.reply(
`╭━━━〔 🎀 sᴀʏ𝟸 ᴛᴛs 〕━━━╮
│
│ ❌ ᴘʟᴇᴀsᴇ ɢɪᴠᴇ ᴍᴇ sᴏᴍᴇ ᴛᴇxᴛ
│
│ 💗 ᴇxᴀᴍᴘʟᴇ:
│
│ ✦ ${prefix}say2 hello baby
│ ✦ ${prefix}say2 hello --v aizen
│ ✦ ${prefix}say2 hello --v momoi
│
│ 💬 ʏᴏᴜ ᴄᴀɴ ᴀʟsᴏ ʀᴇᴘʟʏ
│    ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ.
│
╰━━━━━━━━━━━━━━━━━━╯`
      );
    }

    // ==========================================
    // 📏 TEXT LIMIT
    // ==========================================

    if (text.length > 1500) {
      return message.reply(
`╭━━━〔 ⚠ ᴛᴇxᴛ ᴛᴏᴏ ʟᴏɴɢ 〕━━━╮
│
│ 📝 ᴋɪɴᴅʟʏ ᴋᴇᴇᴘ ᴛʜᴇ ᴛᴇxᴛ
│    ᴡɪᴛʜɪɴ 𝟷𝟻𝟶𝟶 ᴄʜᴀʀᴀᴄᴛᴇʀs.
│
╰━━━━━━━━━━━━━━━━━━╯`
      );
    }

    // ==========================================
    // 🎀 TEMP DIRECTORY
    // ==========================================

    const tempDir = path.join(__dirname, "tmp");

    await fs.ensureDir(tempDir);

    const fileName =
      `say2_${event.senderID}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.mp3`;

    const filePath = path.join(tempDir, fileName);

    // ==========================================
    // ⏳ PROCESS MESSAGE
    // ==========================================

    let processingMsg;

    try {

      processingMsg = await message.reply(
`╭━━━〔 🎀 sᴀʏ𝟸 ᴛᴛs 〕━━━╮
│
│ 🗣 ᴠᴏɪᴄᴇ: ${voice.toUpperCase()}
│
│ ⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴠᴏɪᴄᴇ...
│ 💗 ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ʟɪᴛᴛʟᴇ
│
╰━━━━━━━━━━━━━━━━━━╯`
      );

      // ==========================================
      // 🔗 TTS API
      // ==========================================

      const apiUrl =
        `https://mahis-global-apis.vercel.app/api/tts/${voice}` +
        `?prompt=${encodeURIComponent(text)}`;

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024
      });

      // ==========================================
      // 🔍 CHECK RESPONSE
      // ==========================================

      if (!response.data || !response.data.length) {
        throw new Error("Empty audio response");
      }

      await fs.writeFile(filePath, Buffer.from(response.data));

      // ==========================================
      // 🗑 REMOVE PROCESSING MESSAGE
      // ==========================================

      if (processingMsg) {
        try {
          await message.unsend(processingMsg.messageID);
        } catch {}
      }

      // ==========================================
      // 🎧 SEND AUDIO
      // ==========================================

      await message.reply({
        body:
`╭━━━〔 🎀 sᴀʏ𝟸 ᴛᴛs 〕━━━╮
│
│ 🗣 ᴠᴏɪᴄᴇ: ${voice.toUpperCase()}
│
│ 💬 ${text}
│
│ ✨ ᴠᴏɪᴄᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ
│ 💗 ᴇɴᴊᴏʏ ᴛʜᴇ ᴠᴏɪᴄᴇ ♡
│
╰━━━━━━━━━━━━━━━━━━╯`,
        attachment: fs.createReadStream(filePath)
      });

      // Cleanup temp audio file after 10 seconds
      setTimeout(async () => {
        try {
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
          }
        } catch {}
      }, 10000);

    } catch (error) {

      console.error(
        "[SAY2 TTS ERROR]",
        error?.response?.status || error.message
      );

      // Remove processing message
      if (processingMsg) {
        try {
          await message.unsend(processingMsg.messageID);
        } catch {}
      }

      // ==========================================
      // 🧹 CLEANUP
      // ==========================================

      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      } catch {}

      // ==========================================
      // ❌ ERROR MESSAGE
      // ==========================================

      return message.reply(
`╭━━━〔 ❌ ᴛᴛs ᴇʀʀᴏʀ 〕━━━╮
│
│ ⚠️ ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ
│    ᴀᴜᴅɪᴏ. ᴘʟᴇᴀsᴇ ᴛʀʏ
│    ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.
│
╰━━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
};
