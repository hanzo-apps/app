import { cn } from '@/lib/utils';
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  // Helper to measure function execution time
  const measurePerformance = <T>(
    fn: () => T,
    iterations: number = 1000
  ): { result: T; averageTime: number; minTime: number; maxTime: number } => {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = fn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      result: result!,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  };

  describe('Utility Functions', () => {
    test('cn function performance', () => {
      const testCases = [
        ['px-4', 'py-2', 'mt-4'],
        ['bg-red-500', 'hover:bg-red-600', 'text-white'],
        [{ 'px-4': true, 'py-2': false }, 'mt-4'],
        ['base', undefined, null, 'active'],
      ];

      const results = testCases.map(testCase => {
        const perf = measurePerformance(() => cn(...testCase), 10000);
        return {
          input: testCase,
          ...perf,
        };
      });

      results.forEach(result => {
        // cn function should be very fast - under 0.1ms average
        expect(result.averageTime).toBeLessThan(0.1);
      });

      console.log('cn function performance:', results);
    });

    test('array operations performance', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random(),
        name: `item-${i}`,
      }));

      // Test filtering
      const filterPerf = measurePerformance(
        () => largeArray.filter(item => item.value > 0.5),
        100
      );
      expect(filterPerf.averageTime).toBeLessThan(5); // Should be under 5ms

      // Test mapping
      const mapPerf = measurePerformance(
        () => largeArray.map(item => ({ ...item, doubled: item.value * 2 })),
        100
      );
      expect(mapPerf.averageTime).toBeLessThan(10); // Should be under 10ms

      // Test reducing
      const reducePerf = measurePerformance(
        () => largeArray.reduce((sum, item) => sum + item.value, 0),
        100
      );
      expect(reducePerf.averageTime).toBeLessThan(2); // Should be under 2ms

      console.log('Array operations performance:', {
        filter: filterPerf.averageTime,
        map: mapPerf.averageTime,
        reduce: reducePerf.averageTime,
      });
    });

    test('string manipulation performance', () => {
      const longString = 'Lorem ipsum '.repeat(1000);

      // Test string search
      const searchPerf = measurePerformance(
        () => longString.includes('ipsum'),
        10000
      );
      expect(searchPerf.averageTime).toBeLessThan(0.05);

      // Test string replace
      const replacePerf = measurePerformance(
        () => longString.replace(/ipsum/g, 'dolor'),
        1000
      );
      expect(replacePerf.averageTime).toBeLessThan(1);

      // Test string split
      const splitPerf = measurePerformance(
        () => longString.split(' '),
        1000
      );
      expect(splitPerf.averageTime).toBeLessThan(0.5);

      console.log('String operations performance:', {
        search: searchPerf.averageTime,
        replace: replacePerf.averageTime,
        split: splitPerf.averageTime,
      });
    });

    test('JSON serialization performance', () => {
      const complexObject = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            avatar: `https://example.com/avatar/${i}.jpg`,
            bio: 'Lorem ipsum dolor sit amet',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        })),
      };

      // Test stringify
      const stringifyPerf = measurePerformance(
        () => JSON.stringify(complexObject),
        1000
      );
      expect(stringifyPerf.averageTime).toBeLessThan(2);

      const jsonString = JSON.stringify(complexObject);

      // Test parse
      const parsePerf = measurePerformance(
        () => JSON.parse(jsonString),
        1000
      );
      expect(parsePerf.averageTime).toBeLessThan(2);

      console.log('JSON operations performance:', {
        stringify: stringifyPerf.averageTime,
        parse: parsePerf.averageTime,
      });
    });

    test('regular expression performance', () => {
      const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100);

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

      // Test email regex
      const emailPerf = measurePerformance(
        () => text.match(emailRegex),
        5000
      );
      expect(emailPerf.averageTime).toBeLessThan(0.1);

      // Test URL regex
      const urlPerf = measurePerformance(
        () => text.match(urlRegex),
        5000
      );
      expect(urlPerf.averageTime).toBeLessThan(0.1);

      console.log('Regex performance:', {
        email: emailPerf.averageTime,
        url: urlPerf.averageTime,
      });
    });

    test('async operation performance', async () => {
      // Simulate async operations
      const asyncOperation = async (delay: number) => {
        return new Promise(resolve => setTimeout(resolve, delay));
      };

      const start = performance.now();

      // Test parallel execution
      await Promise.all([
        asyncOperation(10),
        asyncOperation(10),
        asyncOperation(10),
        asyncOperation(10),
        asyncOperation(10),
      ]);

      const parallelTime = performance.now() - start;
      expect(parallelTime).toBeLessThan(20); // Should complete in ~10ms (parallel)

      const start2 = performance.now();

      // Test sequential execution
      for (let i = 0; i < 5; i++) {
        await asyncOperation(10);
      }

      const sequentialTime = performance.now() - start2;
      expect(sequentialTime).toBeGreaterThan(45); // Should take ~50ms (sequential)

      console.log('Async operations performance:', {
        parallel: parallelTime,
        sequential: sequentialTime,
        speedup: sequentialTime / parallelTime,
      });
    });
  });

  describe('Memory Usage', () => {
    test('memory leak detection', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 10000;
      const arrays: any[] = [];

      // Create objects that should be garbage collected
      for (let i = 0; i < iterations; i++) {
        const temp = Array.from({ length: 100 }, () => Math.random());
        // Don't keep reference
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // in MB

      // Memory increase should be minimal (< 10MB) if no leaks
      expect(memoryIncrease).toBeLessThan(10);

      console.log('Memory usage:', {
        initial: initialMemory / 1024 / 1024,
        final: finalMemory / 1024 / 1024,
        increase: memoryIncrease,
      });
    });
  });
});