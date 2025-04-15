# HAL Simulation TypeScript Package

A simulation-only version of the WPILib Hardware Abstraction Layer (HAL) implemented in TypeScript.

## Features

- Complete simulation of HAL devices (DIO, PWM, Analog I/O, Encoders, etc.)
- Direct API access for robot code
- WebSocket server for web-based simulations
- Compatible with WPILib simulation protocol

## Installation

```bash
npm install halsim-ts
```

## Development Setup

```bash
# Clone the repository
git clone https://github.com/wpilibsuite/halsim-ts.git
cd halsim-ts

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run examples
npm run example:simple
npm run example:server
```

## Usage

### Direct API Usage

```typescript
import { HALSimulator } from 'halsim-ts';

// Initialize the HAL simulator
const hal = new HALSimulator();

// Create and use devices
const dio = hal.createDigitalInput(0);
dio.setValue(true);

const pwm = hal.createPWM(1);
pwm.setSpeed(0.5);

// Register callbacks for value changes
dio.registerValueCallback((name, param, value) => {
  console.log(`DIO value changed: ${value.data}`);
}, null, true);
```

### WebSocket Server

```typescript
import { HALSimulator, WSServer } from 'halsim-ts';

// Initialize the HAL simulator
const hal = new HALSimulator();

// Create some devices
const dio = hal.createDigitalInput(0);
const pwm = hal.createPWM(1);

// Start WebSocket server
const server = new WSServer(hal, {
  port: 3300,
  host: 'localhost',
  path: '/wpilibws'
});
server.start();

console.log('WebSocket server started on ws://localhost:3300/wpilibws');
```

### Web Client

```html
<script>
  const ws = new WebSocket('ws://localhost:3300/wpilibws');

  ws.onopen = () => {
    console.log('Connected to HAL simulator');

    // Set a PWM value
    ws.send(JSON.stringify({
      type: 'PWM',
      device: '1',
      data: {
        '<speed': 0.5
      }
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
  };
</script>
```

## Available Devices

- **DigitalInput**: Simulate digital input channels
- **PWM**: Simulate PWM output channels
- **AnalogInput**: Simulate analog input channels
- **Encoder**: Simulate encoders

## WebSocket Protocol

The WebSocket server uses a JSON-based protocol compatible with WPILib's simulation protocol:

```typescript
// Example message format
interface WSMessage {
  type: string;      // Device type (e.g., 'DIO', 'PWM', 'AI')
  device: string;    // Device ID/channel
  data: {            // Data object with properties
    // Properties prefixed with '<' are inputs to the HAL
    // Properties prefixed with '>' are outputs from the HAL
    // Properties prefixed with '<>' can be both
    '<property': value,
    '>property': value,
    '<>property': value
  };
}
```

## Running the Examples

The package includes several examples to help you get started:

- **Simple Robot**: A basic example showing how to use the HAL API directly
  ```bash
  npm run example:simple
  ```

- **WebSocket Server**: An example showing how to set up a WebSocket server
  ```bash
  npm run example:server
  ```

- **Web Simulation**: Open `examples/web-simulation.html` in a browser to see a web-based simulation interface

## License

BSD-3-Clause
