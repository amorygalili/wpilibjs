# WPILib Math Library (TypeScript)

This is a TypeScript implementation of the WPILib Math library, which provides various mathematical utilities for robotics applications.

## Features

- Core math utilities (MathUtil)
- Geometry classes (Rotation2d, etc.)
- Kinematics (to be implemented)
- Trajectory generation and following (to be implemented)
- Controllers (to be implemented)
- Filters (to be implemented)

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Usage

```typescript
import { MathUtil, Rotation2d } from 'wpimath';

// Use MathUtil functions
const clampedValue = MathUtil.clamp(value, min, max);
const deadbandValue = MathUtil.applyDeadband(value, deadband);

// Use Rotation2d
const rotation = Rotation2d.fromDegrees(45);
const rotationRadians = rotation.getRadians();
```

## License

BSD-3-Clause
