module.exports = {
  apps: [
    {
      name: "backend",
      script: "src/index.js",
      node_args: "--experimental-json-modules",
      interpreter: "node",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8000
      },
      env_production: {
        NODE_ENV: "production"
      },
      max_memory_restart: "500M",
      error_file: "/root/.pm2/logs/backend-error.log",
      out_file: "/root/.pm2/logs/backend-out.log",
    }
  ]
};
