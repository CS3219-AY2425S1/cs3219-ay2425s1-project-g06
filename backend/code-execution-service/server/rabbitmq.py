import pika
import os

def _get_channel():
    connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=os.environ.get('RABBITMQ_HOST'), port=os.environ.get('RABBITMQ_PORT'), heartbeat=30))
    channel = connection.channel()
    channel.queue_declare(queue='code-execution', durable=True)
    return channel


def send_message(message: str) -> None:
    _get_channel().basic_publish(exchange='', routing_key='code-execution', body=message,
                          properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent))
