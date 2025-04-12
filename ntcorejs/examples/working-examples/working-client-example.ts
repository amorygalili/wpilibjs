import { NT4_Client, NT4_Topic } from '../../src/working-client/NT4';

const client = new NT4_Client(
    'locahost',
    'FRC Web Components',
    (topic: NT4_Topic) => {
      console.log("topic announced", topic);
    },
    (topic: NT4_Topic) => {
      console.log("topic unannounced", topic);
    },
    (topic: NT4_Topic, _: number, value: unknown) => {
      console.log("topic value changed", topic, value);
    },
    () => {
      console.log("connected");
    },
    () => {
        console.log("disconnected");
    },
  );

  client.subscribe(['/'], true, false, 0.2);
  client.connect();