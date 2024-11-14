# Matching Service

## Set up

```bash
# nvm use 20
npm install
# install rabbitmq -- OS dependent

# below is enable delay message plugin for rabbitmq -- also OS dependent, but generally downloading the build .ez file and move around is the suggested approach
wget https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v4.0.2/rabbitmq_delayed_message_exchange-4.0.2.ez
mv rabbitmq_delayed_message_exchange-4.0.2.ez plugins/
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
# prisma database initialization
npx prisma generate
npx prisma migrate dev --name init
```
