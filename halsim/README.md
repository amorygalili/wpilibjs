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

## Usage

### Direct API Usage

```typescript
import { HALSimulator } from 'halsim-ts';

// Initialize the HAL simulator
const hal = new HALSimulator();

// Create and use devices
const dio = hal.createDigitalOutput(0);
dio.setValue(true);

const pwm = hal.createPWM(1);
pwm.setSpeed(0.5);
```

### WebSocket Server

```typescript
import { HALSimulator, WSServer } from 'halsim-ts';

// Initialize the HAL simulator
const hal = new HALSimulator();

// Start WebSocket server
const server = new WSServer(hal, { port: 3300 });
server.start();
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

## API Documentation

[Link to API documentation]

## License

BSD-3-Clause
