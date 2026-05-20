module.exports = {
  apps: [
    {
      name: "streamboss-api",
      script: "venv/Scripts/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000 --workers 2",
      cwd: "./",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
