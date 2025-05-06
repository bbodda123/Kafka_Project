// server.js
import express from 'express';
import bodyParser from 'body-parser';
import { Kafka } from 'kafkajs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// make the rendering easier
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'web-group' });

let messages = [];

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

app.get('/', (req, res) => {
    res.render('index', { messages });
});

app.post('/produce', async (req, res) => {
    const msg = { message: req.body.message };
    await producer.send({
        topic: 'test-topic',
        messages: [{ value: JSON.stringify(msg) }],
    });
    setTimeout(() => res.redirect('/'), 500); // Delay 0.5 sec
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
