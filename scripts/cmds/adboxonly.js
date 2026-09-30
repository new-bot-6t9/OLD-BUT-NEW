module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "1.4",
		author: "NTKhang x APON",
		countDown: 3,
		role: 1, // Only Group Admins & Bot Admins
		shortDescription: {
			en: "Turn on/off mode where only group admins can use the bot."
		},
		longDescription: {
			en: "Restrict bot commands to group admins only, or toggle notification messages for non-admin users."
		},
		category: "box chat",
		guide: {
			en: "{pn} [on | off]\n{pn} noti [on | off]"
		}
	},

	langs: {
		en: {
			turnedOn: "╭━━━〔 🛡️ ONLY ADMIN BOX 〕━━━╮\n│\n│ ✅ **Only Admin Mode Enabled!**\n│ 👤 Now only group admins can use bot commands.\n│\n╰━━━━━━━━━━━━━━━━━━━━╯",
			turnedOff: "╭━━━〔 🛡️ ONLY ADMIN BOX 〕━━━╮\n│\n│ 🔓 **Only Admin Mode Disabled!**\n│ 👥 Everyone in this group can now use the bot.\n│\n╰━━━━━━━━━━━━━━━━━━━━╯",
			turnedOnNoti: "╭━━━〔 🔔 ADMIN NOTIFICATION 〕━━━╮\n│\n│ 🔔 **Warning Notifications Turned ON!**\n│ ⚠️ Non-admin users will be notified when attempting commands.\n│\n╰━━━━━━━━━━━━━━━━━━━━╯",
			turnedOffNoti: "╭━━━〔 🔕 ADMIN NOTIFICATION 〕━━━╮\n│\n│ 🔕 **Warning Notifications Turned OFF!**\n│ 🔇 Bot will silently ignore commands from non-admins.\n│\n╰━━━━━━━━━━━━━━━━━━━━╯",
			syntaxError: "╭━━━〔 ❌ INVALID USAGE 〕━━━╮\n│\n│ 📌 **Correct Formats:**\n│ ✦ {pn} on — Enable Only Admin mode\n│ ✦ {pn} off — Disable Only Admin mode\n│ ✦ {pn} noti on — Enable warning notifications\n│ ✦ {pn} noti off — Disable warning notifications\n│\n╰━━━━━━━━━━━━━━━━━━━━╯"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		const arg0 = args[0] ? args[0].toLowerCase() : "";

		if (arg0 === "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		const targetVal = args[indexGetVal] ? args[indexGetVal].toLowerCase() : "";

		if (targetVal === "on") {
			value = true;
		} else if (targetVal === "off") {
			value = false;
		} else {
			return message.reply(getLang("syntaxError"));
		}

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		if (isSetNoti) {
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		} else {
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
		}
	}
};
