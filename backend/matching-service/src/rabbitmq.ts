import amqp from 'amqplib';
import { handleUserRequest, handleTimeout, handleConfirmTimeout } from './matchingService';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'topic_queue_math';
const DELAY_EXCHANGE = 'delayed_exchange';
const DELAY_QUEUE = 'delayed_queue';

let rabbitMQChannel: amqp.Channel;

export async function setupRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    rabbitMQChannel = await connection.createChannel();

    await rabbitMQChannel.assertExchange(DELAY_EXCHANGE, 'x-delayed-message', {
      arguments: { 'x-delayed-type': 'direct' },
    });

    await rabbitMQChannel.assertQueue(QUEUE_NAME, { durable: false });
    await rabbitMQChannel.assertQueue(DELAY_QUEUE, { durable: true });
    await rabbitMQChannel.bindQueue(DELAY_QUEUE, DELAY_EXCHANGE, '');

    rabbitMQChannel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const userRequest = JSON.parse(msg.content.toString());
        console.log('Received from queue:', userRequest);
        await handleUserRequest(userRequest);
        rabbitMQChannel.ack(msg);
      }
    });

    rabbitMQChannel.consume(DELAY_QUEUE, async (msg) => {
      if (msg !== null) {
        console.log('Received delayed message:', msg.content.toString());
        const userRequest = JSON.parse(msg.content.toString());

        if (userRequest.type === 'timeout') {
          await handleTimeout(userRequest);
        } else if (userRequest.type === 'confirm_timeout') {
          await handleConfirmTimeout(userRequest.recordId);
        };

        rabbitMQChannel.ack(msg);
      }
    });

    console.log('RabbitMQ setup completed');
  } catch (error) {
    console.error('Error setting up RabbitMQ:', error);
  }
}

export function sendToQueue(message: any) {
  rabbitMQChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)));
}

export function sendDelayedMessage(message: any, delay: number) {
  rabbitMQChannel.publish(DELAY_EXCHANGE, '', Buffer.from(JSON.stringify(message)), {
    headers: { 'x-delay': delay },
  });
}

