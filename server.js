// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'web-group' });

let messages = [];

// Kafka initialization
async function initKafka() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        messages.push(value);
        if (messages.length > 50) messages = messages.slice(-50);
      } catch (err) {
        console.error('Message parsing error:', err);
      }
    },
  });
}
initKafka();

// Auto-produce data from CoinGecko every 10 seconds
setInterval(produceFromAPI, 20000);

async function produceFromAPI() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,gbp');
    const data = await response.json();

    const message = {
      time: new Date().toISOString(),
      usd: `$${data.bitcoin.usd}`,
      eur: `€${data.bitcoin.eur}`,
      gbp: `£${data.bitcoin.gbp}`
    };

    await producer.send({
      topic: 'test-topic',
      messages: [{ value: JSON.stringify(message) }]
    });

    console.log('Message produced:', message);
  } catch (error) {
    console.error('API error:', error);
  }
}


// Route to render page
app.get('/', (req, res) => {
  res.render('index', { messages });
});

// Allow user to produce custom messages
app.post('/produce', async (req, res) => {
  const msg = { message: req.body.message };
  await producer.send({
    topic: 'test-topic',
    messages: [{ value: JSON.stringify(msg) }],
  });
  setTimeout(() => res.redirect('/'), 1000);
});
// Route to clear messages
app.post('/clear-messages', (req, res) => {
    // Filter out messages that don't have the crypto data properties
    messages = []
    messages = messages.filter(m => !(m.usd || m.eur || m.gbp)); // Keep only crypto messages
    res.redirect('/');  // Redirect back to the main page
  });
  

app.listen(port, () => {
  console.log(`Kafka Express server running on http://localhost:${port}`);
});
