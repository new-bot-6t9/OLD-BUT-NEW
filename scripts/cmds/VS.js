const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const ACCESS_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";
const BG_URL = "https://i.ibb.co/0jywW09T/9adc85d7b138.jpg";

module.exports = {
  config: {
    name: "fight",
    aliases: ["vs", "battle"],
    version: "4.2.0",
    author: "APON",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Create a fight/VS meme image" },
    longDescription: { en: "Places your face and the tagged/replied user's face into a fight scene." },
    category: "fun",
    guide: { en: "{pn} @user\nOr reply to someone's message: {pn}" }
  },

  langs: {
    en: {
      noTarget: "⚠️ Please tag an opponent or reply to their message to start a fight!",
      generating: "⚔️ Preparing the fight scene...",
      done: "🥊 **FIGHT!** Let the battle begin!",
      error: "❌ An error occurred while generating the image. Make sure the `canvas` package is installed."
    }
  },

  onStart: async function ({ api, event, message, usersData, getLang }) {
    const fighter1_ID = event.senderID;
    const mentionKeys = Object.keys(event.mentions || {});

    // Target: tagged user first, otherwise replied user
    let fighter2_ID = mentionKeys[0];
    if (!fighter2_ID && event.messageReply) fighter2_ID = event.messageReply.senderID;
    if (!fighter2_ID) return message.reply(getLang("noTarget"));

    async function getFbProfilePic(userId, width = 512, height = 512) {
      const url = `https://graph.facebook.com/${userId}/picture?width=${width}&height=${height}&access_token=${ACCESS_TOKEN}&redirect=false`;
      try {
        const res = await axios.get(url);
        return res.data.data.url;
      } catch {
        return null;
      }
    }

    async function getAvatar(uid) {
      const url = (await getFbProfilePic(uid)) || (await usersData.getAvatarUrl(uid));
      return loadImage(url);
    }

    const loadingMsg = await message.reply(getLang("generating"));
    const unsendLoading = () => {
      try { if (loadingMsg && loadingMsg.messageID) api.unsendMessage(loadingMsg.messageID); } catch {}
    };

    const tmpDir = path.join(__dirname, "tmp");
    fs.ensureDirSync(tmpDir);
    const filePath = path.join(tmpDir, `fight_${fighter1_ID}_${fighter2_ID}_${Date.now()}.png`);

    try {
      const [baseImg, img1, img2] = await Promise.all([
        loadImage(BG_URL),
        getAvatar(fighter1_ID),
        getAvatar(fighter2_ID)
      ]);

      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      function drawCircleAvatar(img, cx, cy, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      const radius = Math.floor(canvas.width * 0.08);

      // =========================================================
      // 📍 FACE POSITIONS (Closer together & slightly lower)
      // =========================================================

      // Fighter 1 (You / Sender) -> ডানদিকে চাপানো এবং নিচে নামানো হয়েছে
      const f1_X = Math.floor(canvas.width * 0.38);
      const f1_Y = Math.floor(canvas.height * 0.37);

      // Fighter 2 (Opponent / Tagged User) -> বামদিকে চাপানো এবং নিচে নামানো হয়েছে
      const f2_X = Math.floor(canvas.width * 0.62);
      const f2_Y = Math.floor(canvas.height * 0.37);

      drawCircleAvatar(img1, f1_X, f1_Y, radius);
      drawCircleAvatar(img2, f2_X, f2_Y, radius);

      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
      unsendLoading();

      await message.reply({
        body: getLang("done"),
        attachment: fs.createReadStream(filePath)
      });
    } catch (err) {
      console.error("[FIGHT COMMAND ERROR]:", err);
      unsendLoading();
      return message.reply(getLang("error"));
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
};
