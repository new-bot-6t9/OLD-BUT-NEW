const moment = require("moment-timezone");

const gifList = [
    "https://i.ibb.co/1Gkvtfc6/54416ebec73c.gif"
];

const getRandomGif = () => gifList[Math.floor(Math.random() * gifList.length)];

module.exports = {
    config: {
        name: "owner",
        aliases: ["whome", "intro", "owner"],
        version: "2.5.1",
        author: "APON",
        countDown: 3,
        role: 0,
        shortDescription: { en: "Display bot owner's information" },
        longDescription: { en: "Shows detailed information about the bot creator and developer." },
        category: "system",
        guide: { en: "{pn}" }
    },

    onStart: async function ({ message, event }) {
        const getStream = global.utils.getStreamFromURL;
        const gif = getRandomGif();

        const time = moment().tz("Asia/Dhaka").format("hh:mm A");
        const date = moment().tz("Asia/Dhaka").format("DD MMM YYYY");

        const ownerCard = 
`╭━━━〔 👑OWNER INFO 〕━━━╮
│
│ 👤 Name      : APON AHMED
│ 🎂 Age       : 20 Years
│ 📍 Location  : Keraniganj, Dhaka, Bangladesh
│ ☪️ Religion  : Islam
│ 🎓 Education : SSC Completed
│ 📱 Device    : POCO F3
│ 💻 Role      :  Bot ADMIN,  OWNER
│ 🎮 Gaming    : Minecraft (SMP), MLBB (Mythic), PUBG Mobile
│ 💖 Status    : In a Relationship
│
│ ⏰ Time      : ${time}
│ 📅 Date      : ${date}
│ ⚡ Status    : ACTIVE & ONLINE
│
╰━━━〔 ✨ Powered by  APON〕━━━╯`;

        return message.reply({
            body: ownerCard,
            attachment: await getStream(gif)
        });
    }
};
