# void-bot
Discord bot for running a private channel rotating a single user, and generated text in that channel

This is mostly hacked together from these tutorials:

Discord for node:
- Tutorial: https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/
- Another, linuxy: https://medium.com/davao-js/2019-tutorial-creating-your-first-simple-discord-bot-47fc836a170b

Textgenrnn (for random text generation):
https://github.com/minimaxir/textgenrnn

GRPC (for communication/control of the bot):
https://grpc.io/docs/languages/node/quickstart/

# Install

	npm install -y
	npm install https://github.com/woor/discord.io/tarball/gateway_v6

textgenrnn will require python 3. Install according to textgenrnn

You will need to have a valid discord bot auth token (covered in the how-to-make-a-discord-bot tutorial). The file auth.json in the root of the repo will look like:

	{
	"token": "A_VERY_LONG_STRING"
	}
