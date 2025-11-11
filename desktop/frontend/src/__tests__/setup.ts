import '@testing-library/jest-dom';

// Mock Tauri API
declare const global: any;

global.window = Object.create(window);
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: () => Promise.resolve(),
    event: {
      listen: () => Promise.resolve(),
      emit: () => Promise.resolve(),
    },
  },
});
