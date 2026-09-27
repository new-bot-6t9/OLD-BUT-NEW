// In-memory tracker for spam logs
const spamMap = new Map();

module.exports = {
    config: {
        name: "antispam",
        version: "4.3.0",
        author: "APON",
        countDown: 0,
        role: 0,
        shortDescription: { en: "Auto-warns at 5 spams and auto-kicks at 7 spams" },
        longDescription: { en: "Monitors group chats and warns a user when they send the exact same message 5 times within 5 minutes, then kicks them on the 7th identical message." },
        category: "SYSTEM",
        guide: { en: "Runs automatically in background." }
    },

    onChat: async function ({ api, event }) {
        const { threadID, senderID, body, isGroup } = event;

        // Process only text messages in group chats (ignore bot's own messages)
        if (!isGroup || !body || senderID === api.getCurrentUserID()) return;

        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
        const userKey = `${threadID}_${senderID}`;

        if (!spamMap.has(userKey)) {
            spamMap.set(userKey, []);
        }

        const userHistory = spamMap.get(userKey);

        // Remove log entries older than 5 minutes
        const recentLogs = userHistory.filter(item => now - item.time < FIVE_MINUTES);

        const currentText = body.trim().toLowerCase();
        recentLogs.push({ body: currentText, time: now });
        spamMap.set(userKey, recentLogs);

        // Count occurrences of the exact same message within the 5-minute window
        const sameMessageCount = recentLogs.filter(item => item.body === currentText).length;

        // Fetch user name for notifications
        let userName = "User";
        try {
            const userInfo = await api.getUserInfo(senderID);
            userName = userInfo[senderID]?.name || "User";
        } catch (e) {}

        // ==========================================
        // 🚨 7TH MESSAGE: KICK FROM GROUP
        // ==========================================
        if (sameMessageCount >= 7) {
            spamMap.delete(userKey); // Clear tracking on kick

            try {
                await api.sendMessage(
                    {
                        body: `╭━━━〔 🚫 ANTI-SPAM KICK 〕━━━╮\n│\n│ 👤 Offender: @${userName}\n│ ⚠️ Reason: Spammed identical message 7 times\n│ ⏱️ Timeframe: Within 5 minutes\n│ 🔨 Action: Kicked from group!\n│\n╰━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [{ tag: `@${userName}`, id: senderID }]
                    },
                    threadID
                );

                api.removeUserFromGroup(senderID, threadID, (err) => {
                    if (err) {
                        console.error("[AntiSpam Error]:", err);
                        api.sendMessage("❌ Failed to kick user. Make sure the bot is an Admin in this group!", threadID);
                    }
                });
            } catch (err) {
                console.error("[AntiSpam Exception]:", err.message);
            }
            return;
        }

        // ==========================================
        // ⚠️ 5TH MESSAGE: WARNING MESSAGE
        // ==========================================
        if (sameMessageCount === 5) {
            try {
                return api.sendMessage(
                    {
                        body: `╭━━━〔 ⚠️ SPAM WARNING 〕━━━╮\n│\n│ 👤 User: @${userName}\n│ 🚨 Warning: You have spammed the same message 5 times!\n│ ⚡ Stop spamming! Reaching 7 messages will get you kicked!\n│\n╰━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [{ tag: `@${userName}`, id: senderID }]
                    },
                    threadID
                );
            } catch (err) {
                console.error("[AntiSpam Warning Exception]:", err.message);
            }
        }
    }
};
