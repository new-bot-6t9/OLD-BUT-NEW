module.exports = {
    config: {
        name: "intro",
        version: "4.3.0",
        author: " APON",
        countDown: 3,
        role: 0,
        shortDescription: { en: "Displays owner details card" },
        longDescription: { en: "Sends owner information card when typing intro2 with or without prefix." },
        category: "ADMIN",
        guide: { en: "{pn} or simply type 'intro2' in chat" },
        aliases: ["owner2", "info2"]
    },

    onStart: async function ({ api, event }) {
        return sendIntroCard(api, event);
    },

    onChat: async function ({ api, event }) {
        if (event.body && event.body.toLowerCase().trim() === "intro2") {
            return sendIntroCard(api, event);
        }
    }
};

function sendIntroCard(api, event) {
    const introText = 
`┌───────────────⭓ 
│ 𝗢𝗪𝗡𝗘𝗥 𝗗𝗘𝗧𝗔𝗜𝗟𝗦 
├─────────────── 
│ 👤𝐍𝐚𝐦𝐞 : APON
│ 🚹 𝐆𝐞𝐧𝐝𝐞𝐫 : 𝐌𝐚𝐥𝐞 
│ ❤️ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧 : ওই সব বিলাসিতা
│ 🎂 𝐀𝐠𝐞 : 20 
│ 🕌 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧 : 𝐈𝐬𝐥𝐚𝐦 
│ 🏡 ADDRESS : DHAKA BANGLADESH 
└───────────────⭓`;

    return api.sendMessage(introText, event.threadID, event.messageID);
}
