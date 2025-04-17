module.exports = {
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Automatically clear mock calls between tests
  clearMocks: true,
  // Tell Jest to use the mock for 'src/auth/entities/user.entity'
  setupFiles: ['<rootDir>/jest.setup.js']
};
