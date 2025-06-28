module.exports = {
  apps: [{
    name: 'smartproject',
    script: '/home/sureshmenon/smartprojectalpha/backend-smartproject/src/index.ts',
    interpreter: 'node',
    interpreter_args: '-r tsx',
    cwd: '/home/sureshmenon/smartprojectalpha',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}; 