const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "wlc",
        version: "4.1.0",
        author: "FYNEX PAPPA",
        countDown: 3,
        role: 0,
        shortDescription: { en: "Manually welcome a tagged user" },
        longDescription: { en: "Sends a welcome message and GIF for the person tagged in the command." },
        category: "TOOLS",
        guide: { en: "{pn} @user" }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, mentions } = event;
        const mentionKeys = Object.keys(mentions || {});

        if (mentionKeys.length === 0) {
            return api.sendMessage("⚠️ Please tag the person you want to welcome!\n\nExample:\n• {pn} @username", threadID, messageID);
        }

        const targetID = mentionKeys[0];
        const targetName = mentions[targetID].replace("@", "");

        const gifUrl = "https://i.imgur.com/zaiRPJF.gif";
        const cacheDir = path.join(__dirname, "cache");
        const gifPath = path.join(cacheDir, `wlc_cmd_${Date.now()}.gif`);

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        let hasGif = false;
        try {
            const res = await axios.get(gifUrl, { responseType: "arraybuffer", timeout: 25000 });
            fs.writeFileSync(gifPath, Buffer.from(res.data));
            hasGif = true;
        } catch (e) {}

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const threadName = threadInfo.threadName || "our Group Chat";
            const memberCount = threadInfo.participantIDs.length;

            const tag = `@${targetName}`;
            const body = `🎉 WELCOME TO THE GROUP! 🎉\n━━━━━━━━━━━━━━━━━━━━\n👋 Welcome: ${tag}\n🏠 Group: ${threadName}\n👥 Member Count: #${memberCount}\n\n✨ Please read the group rules and stay active!\n━━━━━━━━━━━━━━━━━━━━\n👤 System create by: APON`;

            const msgOpts = { body, mentions: [{ tag, id: targetID }] };
            if (hasGif && fs.existsSync(gifPath)) msgOpts.attachment = fs.createReadStream(gifPath);

            return api.sendMessage(msgOpts, threadID, () => {
                if (hasGif && fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
            }, messageID);

        } catch (err) {
            if (hasGif && fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
            return api.sendMessage("❌ Failed to send welcome command.", threadID, messageID);
        }
    }
};
