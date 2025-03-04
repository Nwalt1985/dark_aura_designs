// This file contains type declarations for Jest mocks

declare global {
  namespace jest {
    // Add a more flexible Mock interface that allows any return type
    interface Mock<_T = unknown, _Y extends unknown[] = unknown[]> {
      // Allow any return type for these methods
      mockResolvedValue<TReturn>(val: TReturn): jest.Mock;
      mockRejectedValue<TReturn>(val: TReturn): jest.Mock;
      mockImplementation<TArgs extends unknown[], TReturn>(
        fn: (...args: TArgs) => TReturn,
      ): jest.Mock;
      mockReturnValue<TReturn>(val: TReturn): jest.Mock;
      mockResolvedValueOnce<TReturn>(val: TReturn): jest.Mock;
      mockRejectedValueOnce<TReturn>(val: TReturn): jest.Mock;
    }
  }
}

// This file is a module
export {};
