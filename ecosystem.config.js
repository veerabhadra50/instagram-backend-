export default {
  apps: [
    {
      name: 'instagram-backend',
      script: 'src/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        CORS_ORIGIN: 'https://instagramanalysis.abholdings.info',
      },
      error_file: '/var/log/instagram-backend/error.log',
      out_file: '/var/log/instagram-backend/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
