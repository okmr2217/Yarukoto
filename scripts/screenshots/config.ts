export const CONFIG = {
  BASE_URL: process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000',
  VIEWPORTS: {
    pc: { width: 1280, height: 800 },
    mobile: { width: 390, height: 844 },
  },
  DEVICE_SCALE_FACTOR: 2,
  OUTPUT_DIR: 'output/screenshots',
  AUTH: {
    email: process.env.SCREENSHOT_EMAIL || 'test@example.com',
    password: process.env.SCREENSHOT_PASSWORD || 'password123',
  },
};
