import { Card, Text } from "@mantine/core";
import "./App.css";

function App() {
  return (
    <>
      <Card withBorder>
        <Card.Section>
          <Text>Hello with a card</Text>
        </Card.Section>
      </Card>
      <Card withBorder>
        <Card.Section>
          <Text>Hello with a card</Text>
        </Card.Section>
      </Card>
      <Card withBorder>
        <Card.Section>
          <Text>Hello with a card</Text>
        </Card.Section>
      </Card>
    </>
  );
}

export default App;
