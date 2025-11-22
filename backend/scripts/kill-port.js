const { exec } = require('child_process');
const port = process.argv[2] || 3000;

// Windows command to kill process on port
const command = process.platform === 'win32' 
  ? `netstat -ano | findstr :${port}`
  : `lsof -ti:${port}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.log(`No process found on port ${port}`);
    return;
  }

  if (process.platform === 'win32') {
    // Parse Windows netstat output
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`No process found on port ${port}`);
      return;
    }

    pids.forEach(pid => {
      console.log(`Killing process ${pid} on port ${port}...`);
      exec(`taskkill /PID ${pid} /F`, (killError) => {
        if (killError) {
          console.error(`Failed to kill process ${pid}:`, killError.message);
        } else {
          console.log(`Successfully killed process ${pid}`);
        }
      });
    });
  } else {
    // Unix/Linux/Mac
    const pid = stdout.trim();
    if (pid) {
      console.log(`Killing process ${pid} on port ${port}...`);
      exec(`kill -9 ${pid}`, (killError) => {
        if (killError) {
          console.error(`Failed to kill process:`, killError.message);
        } else {
          console.log(`Successfully killed process ${pid}`);
        }
      });
    }
  }
});

