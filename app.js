/** @format */

require("dotenv").config();
const { App } = require("@slack/bolt");
const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  },
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const docClient = new AWS.DynamoDB.DocumentClient();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

/* Add functionality here */
app.message("hello", async ({ message, say }) => {
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey there <@${message.user}>!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
          },
          action_id: "button_click",
        },
      },
    ],
    text: `Hey there <@${message.user}>!`,
  });
});

const storeCommands = {
  list: async () => {
    //TODO add paging
    const res = await docClient
      .scan({
        TableName: "StoreItems",
      })
      .promise()
      .then((data, err) => {
        if (err) {
          console.log("Events query err: " + JSON.stringify(err));
          return null;
        } else {
          console.log("Events query success: " + JSON.stringify(data));
          return data;
        }
      });
    //serialize data
    return ({
      "blocks": [
        // {
        //   "type": "section",
        //   "text": {
        //     "type": "mrkdwn",
        //     "text": "Purchase fun things from your community"
        //   }
        // },
        // {
        //   "type": "divider"
        // },
        ...res.Items.map(i => (
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*${i.title}*\n${i.description}\nPrice: ${i.cost}points`,
            },
            "accessory": 
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Buy"
              },
              "action_id": "buy",
            }
          }))
        // {
        //   "type": "divider"
        // },
      ],
    });
  },
  create: async (user, params) => {
    console.log('creating with: ' + params);
    const [title, description, cost] = params;
    console.log(`${user}, ${title}, ${description}, ${cost}`);
    if(!title || !cost || !user) {
      return 'Missing arguments';
    }
    // /store create ItemTitle ItemDescription
    const res = await docClient.put({
      TableName: "StoreItems",
      Item: {
        title,
        ...(description && {description}),
        cost,
        user_id: user,
        created_at: new Date().getTime().toString(),
      },
    }).promise()
    .then((data, err) => {
      if (err) {
        console.log("StoreItems put err: " + JSON.stringify(err));
        return null;
      } else {
        console.log("StoreItems put success: " + JSON.stringify(data));
        return data;
      }
    });
    return res? `Created Item:\n${title}${description?"\n" +description:''}\nCost:${cost} points` : "Unable to create item.";
  },
  buy: async () => {
    // fetch item
    // check points
    // log transaction
    // Customer: say Order received
    // ItemOwner: say Blocks

    return {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "You have a new request:\n*<fakeLink.toEmployeeProfile.com|Fred Enriquez - New device request>*",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*User:*\nUser-xx",
            },
            {
              type: "mrkdwn",
              text: "*When:*\nSubmitted Aut 10",
            },
            {
              type: "mrkdwn",
              text: "*Item:*\nITEM-XX",
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Fulfill",
              },
              style: "primary",
              value: "purchase_fulfill",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Reject",
              },
              style: "danger",
              value: "purchase_reject",
            },
          ],
        },
      ],
    };
  },
};

app.action('buy', async ({ack,say}) => {
  // console.log('hioyo');
  await ack();
  await say('Bought Item!');
});

app.command("/repstore", async ({ payload, body, say, respond, ack }) => {
  console.log(`payload: ${JSON.stringify(payload)}`);
  await ack();

  const args = payload.text.split(' ');
  const command = args[0];
  // const args = require("bargs").bargs(
  //   [
  //     { name: "create", type: Boolean },
  //     { name: "title", aliases:'t', type: String },
  //     { name: "description", aliases:'d', type: String },
  //     { name: 'cost', aliases:'c', type: Number},
  //   ],
  //   payload.text.split(" ")
  // );
  
  // const command = args["_unknown"]['_'];
  // const args = require('args-parser')(payload.text.split(' '));
  // console.log(` Command: ${command}\nFrom:${payload.text}  \nTo: ${JSON.stringify(args)}`);
  // console.log(`From:${payload.text}\nTo: ${JSON.stringify(args)}`);
  if (!Object.keys(storeCommands).includes(command)) {
    say("command not recognized: /repstore " + payload.text);
    return;
  }
  const sayParams = await storeCommands[command](payload.user_id, args.slice(1));
  console.log('sayParams: '+sayParams);
  await say(sayParams);
  // await say({
  //   blocks: [
  //     {
  //       type: "section",
  //       text: {
  //         type: "mrkdwn",
  //         text: "You've got a request for xx",
  //       },
  //       accessory: {
  //         type: "button",
  //         text: "fulfilled",
  //         style: "primary",
  //         action_id: "purchase fulfilled",
  //         initial_date: new Date(),
  //         placeholder: {
  //           type: "plain_text",
  //           text: "Select a date",
  //         },
  //       },
  //     },
  //   ],
  // });
});

app.command("/rep", async ({ payload, command, body, say, respond, ack }) => {
  // await ack("tabulating..." + JSON.stringify(payload));
  await ack();
  const { user_id } = payload;
  // fetch last aggregate
  const records = await docClient
    .query({
      TableName: "PointsAggregate",
      KeyConditionExpression: "#id = :user",
      ScanIndexForward: false,
      ExpressionAttributeNames: {
        "#id": "user_id",
      },
      ExpressionAttributeValues: {
        ":user": user_id,
      },
    })
    .promise()
    .then((data, err) => {
      if (err) {
        console.log("Points query err: " + JSON.stringify(err));
        return null;
      } else {
        console.log("Points query success: " + JSON.stringify(data));
        return data;
      }
    });
  const lastRecord = (records?.Items.length && records?.Items[0]) || {
    user_id: null,
    timestamp: "0",
    points: 0,
  };

  // fetch all events since last aggregate timestamp
  const events = await docClient
    .query({
      TableName: "Events",
      KeyConditionExpression: "#id = :user AND #timestamp > :ts",
      ScanIndexForward: false,
      ExpressionAttributeNames: {
        "#id": "user_id",
        "#timestamp": "timestamp",
      },
      ExpressionAttributeValues: {
        ":user": user_id,
        ":ts": lastRecord.timestamp,
      },
    })
    .promise()
    .then((data, err) => {
      if (err) {
        console.log("Events query err: " + JSON.stringify(err));
        return null;
      } else {
        console.log("Events query success: " + JSON.stringify(data));
        return data;
      }
    });

  // tally up + last_aggregate.points
  const sum = (lastRecord?.points || 0) + (events?.Count || 0);
  console.log(sum);
  // record new aggregate
  await docClient.put(
    {
      TableName: "PointsAggregate",
      Item: {
        user_id: user_id,
        timestamp: new Date().getTime().toString(),
        points: sum,
      },
    },
    (err, data) => {
      if (err) console.log("Points put err: " + JSON.stringify(err));
      else console.log("Points put success: " + JSON.stringify(data));
    }
  );

  // pass back new point
  say(`Points: ${sum || "TBD"}`);
});

app.event("reaction_added", async (res) => {
  // console.log("hi: " + JSON.stringify(res));

  await docClient.put(
    {
      TableName: "Events",
      Item: {
        user_id: res.payload.item_user,
        timestamp: res.payload.event_ts,
        reaction_type: res.event.reaction,
        reaction_owner_id: res.payload.user,
      },
    },
    (err, data) => {
      if (err) console.log("put err: " + JSON.stringify(err));
      else console.log("put success: " + JSON.stringify(data));
    }
  );
});

app.action("button_click", async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
