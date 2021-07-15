# repbot
slack bot for community engagement through emoticon reaction counts

# Requires
- ngrok - for local development
- docker - for local dynamodb instance
- Slack App - Test the bot out

# Setup
- Add chat:write, commands, reactions:read to Slack App Oauth
- Enabled Slack App Event Subscription and enter your ngrok tunnel address + '/slack/events' (ex. https://0a7e6e39b2.ngrok.io/slack/events )
  - Under 'subscribe to bot events', add 'reaction_added'
- run `docker-compose up`
- run `npm i` to install packages
- run `npm run init` to setup dynamodb tables locally
- run `npm run dev` to start the app
- Find repbot in Apps section of Slack under 'Add apps'
  - Add to channel that you want it to monitor or just test by talking to repbot in it app channel and like your own message

# Available Slack actions
- `/rep` - show points
- `/repstore create [title] [description] [cost]` - create store item
- `/repstore list` - list items for purchasing
