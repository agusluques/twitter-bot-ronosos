const Twitter = require("twitter");
const axios = require("axios");
const dotenv = require("dotenv").config();
const express = require("express");
const { parse } = require("@fast-csv/parse");

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const phrases = {};

const readFileAndSave = async function () {
  const { data } = await axios.get(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTu7pnYXV8myzgJV3ZQjh33GNRQUmDynXovirq3ETkrgymH75URogEuQhS-bDs-ORqutKGZBTs_5iyh/pub?gid=1740660894&single=true&output=csv"
  );

  const stream = parse({ headers: true })
    .on("error", (error) => console.error(error))
    .on("end", () => tweet())
    .on("data", (row) => {
      if (!phrases[row.ID]) {
        phrases[row.ID] = { ...row, tweeted: row.tweeted === 'TRUE' };
      }
    });

  stream.write(data);
  stream.end();
};

// Tweet a phrase
const tweet = async function () {
    console.log('phrases: ', phrases);
  let phrase = Object.values(phrases).find((phrase) => !phrase.tweeted);

  if (!phrase) {
    phrase =
      Object.values(phrases)[
        Math.floor(Math.random() * Object.keys(phrases).length)
      ];
    if (!phrase) {
      return;
    }
  }

  const tweet = `"${phrase.Phrase}" - ${phrase.Author}`;
  console.log("tweet: ", tweet);
  // tweet
  try {
    const response = await client.post("statuses/update", { status: tweet });
  } catch (error) {
    console.error(error);
    return;
  }

  phrases[phrase.ID].tweeted = true;
};

const execute = async function () {
  readFileAndSave();
};

const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello Roño!");
});

app.get("/phrases", (req, res) => {
  res.send(phrases);
});

app.listen(port, () => {
  console.log("Running bot");
  execute()
  setInterval(execute, 1800000);
});
