const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const configPath = path.join(__dirname, "cache", "mc_servers.json");

function getSavedServers() {
    if (!fs.existsSync(configPath)) return {};
    try {
        return fs.readJsonSync(configPath);
    } catch (e) {
        return {};
    }
}

function saveServerConfig(threadID, serverIP, isBedrock) {
    const data = getSavedServers();
    data[threadID] = {
        ip: serverIP,
        isBedrock: isBedrock,
        updatedAt: Date.now()
    };
    fs.outputJsonSync(configPath, data, { spaces: 2 });
}

async function fetchServerDetails(targetIP, isBedrock) {
    // Primary API: mcstatus.io
    try {
        const type = isBedrock ? "bedrock" : "java";
        const url = `https://api.mcstatus.io/v2/status/${type}/${encodeURIComponent(targetIP)}`;
        const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });

        if (res.status === 200 && res.data) {
            const d = res.data;
            return {
                online: d.online || false,
                ip: d.host || targetIP,
                port: d.port || null,
                playersOnline: d.players?.online ?? 0,
                playersMax: d.players?.max ?? 0,
                version: d.version?.name_clean || d.version?.name || "Unknown",
                motd: d.motd?.clean || "No MOTD provided",
                icon: d.icon || null,
                playersList: d.players?.list?.map(p => p.name_clean || p.name) || []
            };
        }
    } catch (e) {}

    // Fallback API: mcsrvstat.us
    try {
        const endpoint = isBedrock ? `bedrock/3/${encodeURIComponent(targetIP)}` : `3/${encodeURIComponent(targetIP)}`;
        const res = await axios.get(`https://api.mcsrvstat.us/${endpoint}`, { timeout: 10000, validateStatus: () => true });

        if (res.status === 200 && res.data) {
            const d = res.data;
            return {
                online: d.online || false,
                ip: d.ip || targetIP,
                port: d.port || null,
                playersOnline: d.players?.online ?? 0,
                playersMax: d.players?.max ?? 0,
                version: d.version || "Unknown",
                motd: d.motd && d.motd.clean ? d.motd.clean.join("\n").trim() : "No MOTD provided",
                icon: d.icon && d.icon.startsWith("data:image") ? d.icon : null,
                playersList: d.players?.list || []
            };
        }
    } catch (e) {}

    return { online: false };
}

module.exports = {
    config: {
        name: "mcserver",
        version: "4.3.0",
        author: "APON",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Fetch and save Minecraft Java & Bedrock server status" },
        longDescription: { en: "Retrieves live server stats using multi-API fallback. Saves default IP per group chat." },
        category: "MINECRAFT",
        guide: { en: "{pn} | {pn} set <ip> | {pn} set bedrock <ip> | {pn} <ip>" },
        aliases: ["ms", "mcstat", "minecraftserver"]
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const savedData = getSavedServers();

        let isBedrock = false;
        let targetIP = "";

        if (args[0] && args[0].toLowerCase() === "set") {
            if (!args[1]) {
                return api.sendMessage("⚠️ Please provide an IP!\n\nExample: {pn} set demonhuntersmp.loca.lol:9145", threadID, messageID);
            }

            if (args[1].toLowerCase() === "bedrock" || args[1].toLowerCase() === "-b") {
                isBedrock = true;
                targetIP = args.slice(2).join("");
            } else {
                targetIP = args.slice(1).join("");
            }

            if (!targetIP) {
                return api.sendMessage("⚠️ Please enter a valid server IP!", threadID, messageID);
            }

            saveServerConfig(threadID, targetIP, isBedrock);

            return api.sendMessage(
                `⚙️ [SERVER SAVED]\n━━━━━━━━━━━━━━━━━━━━\n✅ Saved default server for this group:\n🌐 IP: ${targetIP}\n🕹️ Edition: ${isBedrock ? "Bedrock 📱" : "Java 💻"}\n\n📌 Type {pn} anytime to fetch live status!`,
                threadID,
                messageID
            );
        }

        if (args.length === 0) {
            if (savedData[threadID] && savedData[threadID].ip) {
                targetIP = savedData[threadID].ip;
                isBedrock = savedData[threadID].isBedrock || false;
            } else {
                return api.sendMessage(
                    "⚠️ No server IP saved for this chat!\n\n💡 Save your server:\n• {pn} set demonhuntersmp.loca.lol:9145",
                    threadID,
                    messageID
                );
            }
        } else {
            if (args[0].toLowerCase() === "bedrock" || args[0].toLowerCase() === "-b") {
                isBedrock = true;
                targetIP = args.slice(1).join("");
            } else if (args[0].toLowerCase() === "java" || args[0].toLowerCase() === "-j") {
                isBedrock = false;
                targetIP = args.slice(1).join("");
            } else {
                targetIP = args.join("");
            }
        }

        api.setMessageReaction("⛏️", messageID, () => {}, true);

        const cacheDir = path.join(__dirname, "cache");
        const iconPath = path.join(cacheDir, `mcicon_${Date.now()}.png`);

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        try {
            const data = await fetchServerDetails(targetIP, isBedrock);

            if (!data.online) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    `🔴 [SERVER OFFLINE / UNREACHABLE]\n━━━━━━━━━━━━━━━━━━━━\n❌ Could not connect to: "${targetIP}"\n\n📌 Reasons:\n1. Server is offline or host PC is closed.\n2. Tunneling issue: If using Localtunnel (.loca.lol), it blocks raw Minecraft sockets. Use Playit.gg or Ngrok TCP instead.`,
                    threadID,
                    messageID
                );
            }

            const editionType = isBedrock ? "Bedrock Edition 📱" : "Java Edition 💻";
            const ipDisplay = `${data.ip}${data.port ? `:${data.port}` : ""}`;

            let playerListText = "";
            if (data.playersList && data.playersList.length > 0) {
                const sample = data.playersList.slice(0, 10).join(", ");
                playerListText = `\n👥 Online Players (${data.playersList.length}): ${sample}${data.playersList.length > 10 ? "..." : ""}`;
            }

            const msgBody = 
`🎮 MINECRAFT SERVER STATUS 🎮
━━━━━━━━━━━━━━━━━━━━
🌐 Server IP: ${ipDisplay}
🕹️ Edition: ${editionType}
🔴 Status: Online ✅
👥 Players: ${data.playersOnline} / ${data.playersMax}
⚙️ Version: ${data.version}${playerListText}

📝 MOTD:
"${data.motd}"
━━━━━━━━━━━━━━━━━━━━
👤 System Managed by: FYNEX PAPPA`;

            api.setMessageReaction("✅", messageID, () => {}, true);

            let hasIcon = false;
            if (data.icon && typeof data.icon === "string" && data.icon.startsWith("data:image")) {
                try {
                    const base64Data = data.icon.replace(/^data:image\/\w+;base64,/, "");
                    fs.writeFileSync(iconPath, Buffer.from(base64Data, "base64"));
                    hasIcon = true;
                } catch (e) {}
            }

            const msgOpts = { body: msgBody };
            if (hasIcon && fs.existsSync(iconPath)) {
                msgOpts.attachment = fs.createReadStream(iconPath);
            }

            return api.sendMessage(
                msgOpts,
                threadID,
                () => { if (hasIcon && fs.existsSync(iconPath)) fs.unlinkSync(iconPath); },
                messageID
            );

        } catch (err) {
            console.error("[MCServer Error]:", err.message);
            api.setMessageReaction("❌", messageID, () => {}, true);
            if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
            return api.sendMessage("❌ Failed to query server status. Please check your IP/tunnel settings.", threadID, messageID);
        }
    }
};
