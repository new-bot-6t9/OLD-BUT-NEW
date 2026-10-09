module.exports = {
  config: {
    name: "bump",
    aliases: ["bm", "save"],
    version: "1.0.0",
    author: "APON",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Bump/re-send a replied message" },
    longDescription: { en: "Copies the text and attachments of the replied message and sends it again." },
    category: "utility",
    guide: { en: "Reply to any message and type: {pn}" }
  },

  onStart: async function ({ api, event, message }) {
    const { messageReply } = event;

    if (!messageReply) {
      return message.reply("⚠️ Please reply to the message you want to bump!");
    }

    try {
      const { body, attachments } = messageReply;
      const attachmentStreams = [];

      // অ্যাটাচমেন্ট (ছবি/ভিডিও/অডিও) প্রসেস করা
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.url) {
            try {
              const stream = await global.utils.getStreamFromURL(att.url);
              attachmentStreams.push(stream);
            } catch (streamErr) {
              console.error("[BUMP STREAM ERROR]:", streamErr);
            }
          }
        }
      }

      const msgPayload = {};
      if (body) msgPayload.body = body;
      if (attachmentStreams.length > 0) msgPayload.attachment = attachmentStreams;

      if (!msgPayload.body && attachmentStreams.length === 0) {
        return message.reply("❌ Nothing found in the replied message to bump!");
      }

      return api.sendMessage(msgPayload, event.threadID);
    } catch (err) {
      console.error("[BUMP COMMAND ERROR]:", err);
      return message.reply("❌ Failed to bump the message. Please try again!");
    }
  }
};
