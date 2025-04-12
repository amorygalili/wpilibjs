# Using OutlineViewer with TypeScript Robot Projects

This guide explains how to use OutlineViewer to view and modify NetworkTables data from TypeScript robot projects.

## Prerequisites

- WPILib installed (includes OutlineViewer)
- TypeScript robot project
- NetworkTables server running

## Quick Start: Using the run-with-outlineviewer.js Script

We provide a script that automates the process of running a robot program with OutlineViewer:

```bash
node run-with-outlineviewer.js [robot-class-path]
```

This script:
1. Starts the NetworkTables server if it's not already running
2. Launches OutlineViewer
3. Runs the specified robot class

Example:
```bash
node run-with-outlineviewer.js OutlineViewerTest
```

If no robot class path is provided, it will run the OutlineViewerTest example.

## Manual Setup

If you prefer to set up everything manually, follow these steps:

### Step 1: Start the NetworkTables Server

First, start the NetworkTables server:

```bash
node examples/NT4Server.js
```

You should see output like:

```
NetworkTables 4 server started on port 5810
```

### Step 2: Start the Robot Program

Run your robot program with the external NetworkTables option:

```bash
node run-with-external-nt.js OutlineViewerTest
```

You should see output like:

```
Checking if port 5810 is in use...
Port 5810 is already in use. Assuming NetworkTables server is running.
Starting robot with class: OutlineViewerTest...
Using NetworkTables server: ws://localhost:5810
********** Robot program starting **********
Robot initialized!
User program starting
********** Robot program startup complete **********
Connected to NetworkTables server
```

## Step 3: Configure OutlineViewer

1. Launch OutlineViewer from the WPILib installation:
   - Windows: `C:\Users\Public\wpilib\2024\tools\outlineviewer.exe`

2. When OutlineViewer starts, you'll see a connection dialog:

   - **Server Mode**: Select "Client"
   - **Team Number/Server**: Enter "localhost" or "127.0.0.1"
   - **Port**: Enter "5810"

3. Click "Connect" to connect to the NetworkTables server.

## Step 4: View and Modify NetworkTables Data

Once connected, you'll see the NetworkTables data published by your robot:

- The left panel shows the hierarchy of topics
- The right panel shows the values of the selected topics

You can:
- Expand/collapse topics by clicking the arrows
- View the values of topics
- Modify values by double-clicking on them
- Add new topics by right-clicking and selecting "Add"
- Remove topics by right-clicking and selecting "Delete"

## Example: OutlineViewerTest

The OutlineViewerTest example publishes a variety of data types to NetworkTables:

- Boolean values: `OutlineViewerTest/Boolean/Value`, `OutlineViewerTest/Boolean/Toggle`, `OutlineViewerTest/Boolean/Array`
- Number values: `OutlineViewerTest/Number/Value`, `OutlineViewerTest/Number/Sine`, `OutlineViewerTest/Number/Cosine`, `OutlineViewerTest/Number/Array`
- String values: `OutlineViewerTest/String/Value`, `OutlineViewerTest/String/Counter`, `OutlineViewerTest/String/Array`
- Robot state: `OutlineViewerTest/Robot/Enabled`, `OutlineViewerTest/Robot/Mode`, `OutlineViewerTest/Robot/Battery`
- Simulated sensors: `OutlineViewerTest/Sensors/Encoder/Position`, `OutlineViewerTest/Sensors/Encoder/Velocity`, `OutlineViewerTest/Sensors/Gyro/Angle`, `OutlineViewerTest/Sensors/Gyro/Rate`, `OutlineViewerTest/Sensors/Ultrasonic/Distance`
- Simulated motors: `OutlineViewerTest/Motors/Left`, `OutlineViewerTest/Motors/Right`, `OutlineViewerTest/Motors/Arm`

## Troubleshooting

### OutlineViewer Can't Connect

If OutlineViewer can't connect to the NetworkTables server:

1. Make sure the NetworkTables server is running
2. Check that you're using the correct port (5810)
3. Make sure no firewall is blocking the connection
4. Try restarting the NetworkTables server and OutlineViewer

### No Data Appears in OutlineViewer

If no data appears in OutlineViewer:

1. Make sure the robot program is running and connected to the NetworkTables server
2. Check the server output for any errors
3. Try publishing some test data to NetworkTables

### OutlineViewer Crashes

If OutlineViewer crashes:

1. Make sure you're using the correct version of OutlineViewer for your WPILib installation
2. Try running OutlineViewer with administrator privileges
3. Check the Windows Event Viewer for any error messages

## Conclusion

OutlineViewer is a powerful tool for debugging and testing robot programs. By connecting it to your TypeScript robot projects, you can easily view and modify NetworkTables data, which can be invaluable for debugging and testing.
