const truthQuestions = [
    "তোমার জীবনের সবচেয়ে খুশির মুহূর্ত কোনটি ছিলো ?",
    "তুমি কি কখনো এই গ্রুপের কারো ওপর ক্রাশ খেয়েছ? নাম বলো!",
    "তোমার বলা সবচেয়ে বড় মিথ্যাটি কী ছিল?",
    "এই গ্রুপের কাকে তোমার সবচেয়ে বেশি অপছন্দ এবং কেন?",
    "তোমার ফোনের ব্রাউজার হিস্ট্রি শেষ কবে ডিলিট করেছ এবং কেন?",
    "তুমি কি কখনো কারো ছবি ঘণ্টার পর ঘণ্টা স্টক (stalk) করেছো ?",
    "যদি তোমাকে এই গ্রুপের একজনের সাথে ১ দিন ঘুরবার সুযোগ দেয়া হয়, কাকে বেছে নেবে?",
    "তোমার জীবনের সবচেয়ে বড় ভুলটি কী ছিল?",
    "তুমি কি কখনো কারো মেসেজের সিন করে রিপ্লাই না দিয়ে ইগনোর করেছ? কেন?",
    "তোমার কোনো ব্যাড হ্যাবিট থাকলে বলো!"
];

const dareTasks = [
    "তোমার গাওয়া একটি ১০ সেকেন্ডের গান ভয়েস নোটে গ্রুপে পাঠাও!",
    "তোমার ক্রাশকে  উদ্দেশ্যে একটি রোমান্টিক মেসেজ করো।",
    "গ্রুপে তোমার গ্যালারির ৩ নম্বর ছবিটা পোস্ট করো!",
    "তোমার ফেসবুকের বায়োতে 'Im in love' লিখে ১ দিন রাখো এবং স্ক্রিনশট দাও!",
    "গ্রুপের যেকোনো একজন সদস্যকে একটা nickname দাও এবং ১ দিন সেটা রাখতে হবে টেক্সট দাও।",
    "নিজের সবচেয়ে ফানি একটি ৫ সেকেন্ডের ভয়েস পাঠাও!",
    "গ্রুপের যেকোনো একজনকে উদ্দেশ্য করে একটি রোমান্টিক ডায়ালগ ভয়েসে বলো!"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
    config: {
        name: "tod",
        aliases: ["tord", "truthordare", "td"],
        version: "4.3.0",
        author: "APON",
        countDown: 3,
        role: 0,
        category: "games",
        description: "Tag someone and assign Truth or Dare question/task.",
        guide: {
            en: "{pn} @mention t\n{pn} @mention d\n{pn} @mention (randomly chooses Truth or Dare)"
        }
    },

    onStart: async function ({ message, event, args }) {
        const { mentions } = event;
        const mentionIDs = Object.keys(mentions || {});

        if (mentionIDs.length === 0) {
            return message.reply(
`╭━━━〔 🎲 TRUTH OR DARE 〕━━━╮
│
│ ❌ **কাউকে ট্যাগ করা হয়নি!**
│
│ 📌 **ব্যবহারের নিয়ম:**
│ ✦ tod @persone t  (Truth এর জন্য)
│ ✦ tod @person d  (Dare এর জন্য)
│ ✦ tod @person    ( T or D)
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            );
        }

        const targetID = mentionIDs[0];
        const targetName = mentions[targetID].replace(/^@/, "");

        const inputStr = args.join(" ").toLowerCase();
        let choice = "";

        if (/\b(t|truth)\b/i.test(inputStr)) {
            choice = "TRUTH";
        } else if (/\b(d|dare)\b/i.test(inputStr)) {
            choice = "DARE";
        } else {
            choice = Math.random() > 0.5 ? "TRUTH" : "DARE";
        }

        let selectedText = "";
        let emoji = "";

        if (choice === "TRUTH") {
            emoji = "🤔";
            selectedText = getRandomItem(truthQuestions);
        } else {
            emoji = "🔥";
            selectedText = getRandomItem(dareTasks);
        }

        const responseMsg = 
`╭━━━〔 🎲 TRUTH OR DARE 〕━━━╮
│
│ 👤 Target: @${targetName}
│ 🎭 Mode: ${choice} ${emoji}
│
│ 📌 ${choice === "TRUTH" ? "প্রশ্ন (Truth)" : "টাস্ক (Dare)"}:
│ "${selectedText}"
│
│ ⏱️ দ্রুত উত্তর/টাস্ক পূরণ করো!
│
╰━━━━━━━━━━━━━━━━━━━━╯`;

        return message.reply({
            body: responseMsg,
            mentions: [{ tag: `@${targetName}`, id: targetID }]
        });
    }
};
