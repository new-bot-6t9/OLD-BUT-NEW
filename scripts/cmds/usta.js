Cmd install Usta.js 
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const ACCESS_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";
const BG_URL = "https://i.ibb.co/k2DJ8BPD/7a16287aa846.jpg";

module.exports = {
  config: {
    name: "usta",
    aliases: ["latthi", "kickas"],
    version: "4.2.0",
    author: "APON",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Place faces on Latthi/Usta meme image" },
    longDescription: { en: "Puts your face and the tagged/replied user's face onto the characters in the meme image." },
    category: "fun",
    guide: { en: "{pn} @user\nOr reply to someone's message: {pn}" }
  },

  langs: {
    en: {
      noTarget: "⚠️️ Tag someone or reply to their message to give them a latthi!",
      generating: "🎨 Generating image, please wait...",
      done: "💥 এখানে থেকে সর",
      error: "❌ An error occurred while rendering the image. Make sure the `canvas` package is installed."
    }
  },

  onStart: async function ({ api, event, message, usersData, getLang }) {
    const kickerID = event.senderID;
    const mentionKeys = Object.keys(event.mentions || {});

    let victimID = mentionKeys[0];
    if (!victimID && event.messageReply) victimID = event.messageReply.senderID;
    if (!victimID) return message.reply(getLang("noTarget"));

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
    const filePath = path.join(tmpDir, `usta_${kickerID}_${victimID}_${Date.now()}.png`);

    try {
      const [baseImg, img1, img2] = await Promise.all([
        loadImage(BG_URL),
        getAvatar(kickerID),
        getAvatar(victimID)
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

      const radius = Math.floor(canvas.width * 0.09);

      // =========================================================
      // 📍 FACE POSITIONS
      // =========================================================
      
      // 1st Person (Kicker / You) -> ডানে ও উপরে সরানো হয়েছে
      const kickerX = Math.floor(canvas.width * 0.73);  // ডানে সরানোর জন্য 0.73 করা হয়েছে
      const kickerY = Math.floor(canvas.height * 0.26); // উপরে তোলার জন্য 0.26 করা হয়েছে

      // 2nd Person (Victim / Mentioned User)
      const victimX = Math.floor(canvas.width * 0.38);
      const victimY = Math.floor(canvas.height * 0.22);

      drawCircleAvatar(img1, kickerX, kickerY, radius);
      drawCircleAvatar(img2, victimX, victimY, radius);

      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
      unsendLoading();

      await message.reply({
        body: getLang("done"),
        attachment: fs.createReadStream(filePath)
      });
    } catch (err) {
      console.error("[USTA COMMAND ERROR]:", err);
      unsendLoading();
      return message.reply(getLang("error"));
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
};
