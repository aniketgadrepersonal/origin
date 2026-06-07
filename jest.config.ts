import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Points to your Next.js app root so Jest can load next.config.js and .env files
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",

  // Use jsdom for React component tests; individual test files can override to 'node'
  testEnvironment: "jsdom",

  // Run after jest is initialised — sets up @testing-library/jest-dom matchers
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Path alias mirrors tsconfig so imports like @/lib/store work in tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Only pick up test files — avoids accidentally running storybook snapshots etc.
  testMatch: [
    "<rootDir>/__tests__/**/*.test.ts",
    "<rootDir>/__tests__/**/*.test.tsx",
  ],

  // Coverage thresholds — fail CI if coverage drops below these
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/*.ts",
    "!src/**/*.d.ts",
  ],
};

export default createJestConfig(config);
