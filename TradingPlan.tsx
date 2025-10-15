import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Database, Network, LucideIcon } from 'lucide-react';

type SectionKey = 'overview' | 'fixed' | 'benchmark1' | 'benchmark2' | 'testing';
type CodeKey = 'main' | 'orderbook_interface' | 'sync_wrapper' | 'matching_engine' | 'readers' | 'metrics' | 'test_harness';

interface SectionProps {
  id: SectionKey;
  title: string;
  color: string;
  children: React.ReactNode;
}

interface BoxProps {
  title: string;
  items: string[];
  color?: string;
  codeKey?: CodeKey;
  icon?: LucideIcon;
}

export default function TradingPlatformArchitecture() {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    overview: true,
    fixed: true,
    benchmark1: true,
    benchmark2: true,
    testing: true
  });

  const [showCode, setShowCode] = useState<CodeKey | null>(null);

  const toggle = (key: SectionKey) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const Section: React.FC<SectionProps> = ({ id, title, color, children }) => (
    <div className={`mb-3 ${color} rounded-lg overflow-hidden border-2`}>
      <div 
        className="p-4 font-bold cursor-pointer flex items-center gap-2"
        onClick={() => toggle(id)}
      >
        {expanded[id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        {title}
      </div>
      {expanded[id] && (
        <div className="p-4 pt-0 space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  const Box: React.FC<BoxProps> = ({ title, items, color = "bg-gray-700", codeKey, icon: Icon }) => (
    <div className={`${color} rounded p-3 border border-white/10`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          <div className="font-semibold text-sm">{title}</div>
        </div>
        {codeKey && (
          <button 
            onClick={() => setShowCode(showCode === codeKey ? null : codeKey)}
            className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded flex items-center gap-1"
          >
            <Code className="w-3 h-3" />
            {showCode === codeKey ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      <div className="text-xs space-y-1 opacity-90">
        {items.map((item: string, i: number) => <div key={i}>{item}</div>)}
      </div>
      {showCode === codeKey && (
        <pre className="mt-3 bg-black/40 p-3 rounded text-xs overflow-x-auto">
          <code className="text-green-300">{getCodeSnippet(codeKey)}</code>
        </pre>
      )}
    </div>
  );

  const getCodeSnippet = (key: CodeKey): string => {
    const snippets = {
      main: `// main.cpp - System Initialization
int main() {
    // 1. Create instrumentation
    auto metrics = std::make_shared<MetricsCollector>();
    
    // 2. Create order book (THIS IS WHAT YOU SWAP)
    auto book = createOrderBook(OrderBookType::SKIP_LIST);
    // Options: STD_MAP, SKIP_LIST, ARRAY_BASED
    
    // 3. Create synchronization wrapper (THIS IS WHAT YOU SWAP)
    auto sync_book = wrapWithSync(
        std::move(book), 
        SyncStrategy::RCU
    );
    // Options: COARSE_LOCK, FINE_LOCK, LOCK_FREE, RCU
    
    // 4. Create matching engine (single-threaded)
    MatchingEngine engine(
        std::move(sync_book),
        std::make_unique<PriceTimeAlgo>(),
        metrics
    );
    
    // 5. Create reader threads
    MarketDataPublisher md_publisher(engine.getBook(), metrics);
    GUIUpdater gui(engine.getBook());
    
    // 6. Create I/O threads
    MarketServer server(engine.getInputQueue());
    PersistenceWorker persistence(engine.getTradeQueue());
    
    // 7. Pin threads to cores
    pinThread(engine.thread(), 0);          // P-Core 0
    pinThread(md_publisher.thread(), 4);    // P-Core 4
    pinThread(gui.thread(), 10);            // E-Core 10
    
    // 8. Start system
    server.start();
    engine.start();
    md_publisher.start();
    persistence.start();
    
    return app.exec();
}`,
      orderbook_interface: `// Benchmark #1: Order Book Data Structure
class IOrderBook {
public:
    virtual void addOrder(const Order& order) = 0;
    virtual void cancelOrder(OrderID id) = 0;
    virtual std::optional<Price> getBestBid() const = 0;
    virtual std::optional<Price> getBestAsk() const = 0;
    virtual std::vector<Order> getMatchable(
        Side side, Price limit, Volume amount) = 0;
    virtual OrderBookSnapshot getSnapshot() const = 0;
};

// Implementation 1: std::map
class MapOrderBook : public IOrderBook {
private:
    std::map<Price, PriceLevel, std::greater<>> bids_;
    std::map<Price, PriceLevel, std::less<>> asks_;
    std::unordered_map<OrderID, OrderLocation> order_index_;
    
public:
    void addOrder(const Order& order) override {
        auto& levels = (order.side == Side::BID) ? bids_ : asks_;
        levels[order.price].addOrder(order);
        order_index_[order.id] = {order.side, order.price};
    }
    // Complexity: O(log n) insert, O(log n) delete
    // Cache: Poor (tree traversal, pointer chasing)
    // Memory: Dynamic allocation per node
};

// Implementation 2: Skip List
class SkipListOrderBook : public IOrderBook {
private:
    SkipList<Price, PriceLevel, std::greater<>> bids_;
    SkipList<Price, PriceLevel, std::less<>> asks_;
    std::unordered_map<OrderID, OrderLocation> order_index_;
    
public:
    void addOrder(const Order& order) override {
        auto& levels = (order.side == Side::BID) ? bids_ : asks_;
        levels.insert(order.price, order);
        order_index_[order.id] = {order.side, order.price};
    }
    // Complexity: O(log n) probabilistic
    // Cache: Better (contiguous levels, fewer pointers)
    // Memory: Dynamic but more cache-friendly
};

// Implementation 3: Array-based (LOB)
class ArrayOrderBook : public IOrderBook {
private:
    static constexpr size_t PRICE_LEVELS = 10000;
    static constexpr Price MIN_PRICE = 0;
    static constexpr Price MAX_PRICE = 100000;
    
    PriceLevel bid_levels_[PRICE_LEVELS];
    PriceLevel ask_levels_[PRICE_LEVELS];
    size_t best_bid_idx_ = PRICE_LEVELS / 2;
    size_t best_ask_idx_ = PRICE_LEVELS / 2;
    std::unordered_map<OrderID, OrderLocation> order_index_;
    
    size_t priceToIndex(Price price) const {
        return (price - MIN_PRICE) * PRICE_LEVELS / (MAX_PRICE - MIN_PRICE);
    }
    
public:
    void addOrder(const Order& order) override {
        size_t idx = priceToIndex(order.price);
        auto& level = (order.side == Side::BID) 
            ? bid_levels_[idx] 
            : ask_levels_[idx];
        level.addOrder(order);
        order_index_[order.id] = {order.side, order.price};
    }
    // Complexity: O(1) access if price in range
    // Cache: Excellent (array traversal, prefetch-friendly)
    // Memory: Fixed allocation, sparse array waste
};`,
      sync_wrapper: `// Benchmark #2: Reader/Writer Synchronization
template<typename OrderBookImpl>
class ISyncOrderBook {
public:
    virtual void addOrder(const Order& order) = 0;
    virtual void cancelOrder(OrderID id) = 0;
    virtual std::optional<Price> getBestBid() const = 0;
    virtual std::optional<Price> getBestAsk() const = 0;
    virtual OrderBookSnapshot getSnapshot() const = 0;
};

// Strategy 1: Coarse Lock
template<typename OrderBookImpl>
class CoarseLockOrderBook : public ISyncOrderBook<OrderBookImpl> {
private:
    mutable std::mutex mutex_;
    OrderBookImpl book_;
    
public:
    void addOrder(const Order& order) override {
        std::lock_guard<std::mutex> lock(mutex_);
        book_.addOrder(order);
    }
    
    std::optional<Price> getBestBid() const override {
        std::lock_guard<std::mutex> lock(mutex_);
        return book_.getBestBid();
    }
    
    OrderBookSnapshot getSnapshot() const override {
        std::lock_guard<std::mutex> lock(mutex_);
        return book_.getSnapshot();
    }
};

// Strategy 2: RCU (Read-Copy-Update)
template<typename OrderBookImpl>
class RCUOrderBook : public ISyncOrderBook<OrderBookImpl> {
private:
    std::atomic<OrderBookImpl*> book_;
    std::mutex write_mutex_;
    
public:
    RCUOrderBook() : book_(new OrderBookImpl()) {}
    
    void addOrder(const Order& order) override {
        std::lock_guard<std::mutex> lock(write_mutex_);
        
        // Copy, modify, swap
        OrderBookImpl* old_book = book_.load();
        OrderBookImpl* new_book = new OrderBookImpl(*old_book);
        new_book->addOrder(order);
        book_.store(new_book);
        
        rcu_synchronize();
        delete old_book;
    }
    
    std::optional<Price> getBestBid() const override {
        OrderBookImpl* book = book_.load(std::memory_order_acquire);
        return book->getBestBid();
    }
};`,
      matching_engine: `// Matching Engine - Single-threaded (Fixed)
class MatchingEngine {
private:
    std::unique_ptr<ISyncOrderBook> book_;
    std::unique_ptr<IMatchingAlgorithm> algorithm_;
    std::shared_ptr<MetricsCollector> metrics_;
    
    BoundedQueue<Order> input_queue_;
    BoundedQueue<Trade> trade_queue_;
    std::atomic<bool> running_{false};
    std::thread thread_;
    
public:
    void run() {
        while (running_) {
            Order order;
            if (input_queue_.try_dequeue(order)) {
                auto handle = metrics_->recordEntry(order.id);
                
                book_->addOrder(order);
                auto trades = algorithm_->match(order, *book_);
                
                for (auto& trade : trades) {
                    trade_queue_.try_enqueue(trade);
                }
                
                metrics_->recordLatency(handle);
            }
        }
    }
};`,
      readers: `// Reader Threads
class MarketDataPublisher {
private:
    std::shared_ptr<ISyncOrderBook> book_;
    std::thread thread_;
    
public:
    void run() {
        while (running_) {
            auto best_bid = book_->getBestBid();
            auto best_ask = book_->getBestAsk();
            
            if (best_bid && best_ask) {
                Quote quote{*best_bid, *best_ask, now()};
                multicast_socket_.send(serialize(quote));
            }
            
            std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
    }
};

class GUIUpdater {
private:
    std::shared_ptr<ISyncOrderBook> book_;
    
public:
    void run() {
        while (running_) {
            auto snapshot = book_->getSnapshot();
            emit updateOrderBook(snapshot);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
};`,
      metrics: `// Instrumentation - Lock-Free Metrics
class MetricsCollector {
private:
    struct alignas(64) ThreadLocal {
        std::atomic<uint64_t> orders_processed{0};
        RingBuffer<LatencySample, 1000000> samples;
    };
    
    std::array<ThreadLocal, 12> thread_data_;
    
public:
    struct TimestampHandle {
        OrderID id;
        uint64_t timestamp;
    };
    
    TimestampHandle recordEntry(OrderID id) {
        return {id, __rdtsc()};
    }
    
    void recordLatency(TimestampHandle handle) {
        uint64_t now = __rdtsc();
        uint64_t cycles = now - handle.timestamp;
        double ns = cycles_to_nanoseconds(cycles);
        
        int tid = get_thread_id();
        thread_data_[tid].samples.push({handle.id, ns});
    }
    
    Statistics getStatistics() const {
        std::vector<double> all_latencies;
        for (const auto& td : thread_data_) {
            for (const auto& sample : td.samples) {
                all_latencies.push_back(sample.latency_ns);
            }
        }
        
        std::sort(all_latencies.begin(), all_latencies.end());
        return {
            .p50 = percentile(all_latencies, 50),
            .p99 = percentile(all_latencies, 99),
            .p999 = percentile(all_latencies, 99.9)
        };
    }
};`,
      test_harness: `// Testing Framework
class BenchmarkHarness {
public:
    struct Config {
        OrderBookType book_type;
        SyncStrategy sync_strategy;
        
        uint32_t orders_per_second;
        uint32_t num_readers;
        double read_frequency_hz;
        
        std::chrono::seconds warmup{30};
        std::chrono::seconds measurement{300};
    };
    
    struct Results {
        double engine_latency_p50;
        double engine_latency_p99;
        double engine_latency_p999;
        
        double reader_latency_p50;
        double reader_latency_p99;
        
        double cpu_usage_percent;
        uint64_t cache_misses;
    };
    
    Results runBenchmark(const Config& cfg) {
        auto book = createOrderBook(cfg.book_type);
        auto sync_book = wrapWithSync(std::move(book), cfg.sync_strategy);
        auto metrics = std::make_shared<MetricsCollector>();
        
        MatchingEngine engine(std::move(sync_book), ..., metrics);
        
        std::vector<std::thread> readers;
        for (uint32_t i = 0; i < cfg.num_readers; ++i) {
            readers.emplace_back([&]() {
                readerThread(engine.getBook(), metrics);
            });
        }
        
        pinThreads();
        
        OrderGenerator generator(cfg.orders_per_second);
        generator.run(cfg.warmup);
        metrics->reset();
        
        generator.run(cfg.measurement);
        
        return collectResults(metrics);
    }
};`
    };
    return snippets[key] || "// Code snippet not found";
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-3">
          Benchmarking Plan
        </h1>
        <p className="text-gray-400 mb-6">
          Reader/writer synchronization strategies for order book access under contention
        </p>

        <Section id="overview" title="Research Question" color="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500">
          
          <div className="bg-blue-900/40 border-2 border-blue-400 rounded-lg p-4 mb-4">
            <div className="text-sm font-bold text-blue-200 mb-3">Core Trade-Off</div>
            <div className="grid grid-cols-3 gap-3 text-xs text-white">
              <div>
                <div className="font-semibold mb-1 text-blue-300">Critical Path:</div>
                <div>P-Core 0: Matching Engine</div>
              </div>
              <div>
                <div className="font-semibold mb-1 text-green-300">Readers:</div>
                <div>P-Core 4: Market Data</div>
                <div>E-Core 10: GUI Updater</div>
              </div>
              <div>
                <div className="font-semibold mb-1 text-gray-300">I/O:</div>
                <div>P-Cores 1-3: Network ingestion</div>
                <div>E-Cores 8-9: Persistence</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/60 border border-gray-600 rounded-lg p-4">
            <div className="text-sm font-bold mb-3 text-gray-300">Architecture Principle</div>
            <div className="text-xs space-y-2 text-gray-400">
              <div>Single-threaded matching engine processes orders sequentially (determinism requirement)</div>
              <div>Order book is the hotpath (80% of matching engine time spent here)</div>
              <div>Multiple reader threads need concurrent access without blocking matching</div>
              <div>Two independent benchmarks: order book structure and synchronization strategy</div>
            </div>
          </div>

          <Box 
            title="Main Initialization"
            items={[
              'Create order book with chosen implementation',
              'Wrap with synchronization strategy',
              'Inject into matching engine',
              'Start reader threads (market data, GUI)',
              'Pin all threads to specific cores'
            ]}
            color="bg-blue-700 text-white"
            codeKey="main"
          />
        </Section>

        <Section id="fixed" title="Fixed Components (Infrastructure)" color="bg-gradient-to-r from-gray-700 to-gray-800 text-white border-gray-600">
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Box 
              title="Market Server (3 threads, P-Cores 1-3)"
              items={[
                'Boost.Asio async network I/O',
                'Receives orders from clients',
                'Validates and timestamps',
                'Enqueues to matching engine'
              ]}
              color="bg-gray-700 text-white"
              icon={Network}
            />

            <Box 
              title="Persistence (2 threads, E-Cores 8-9)"
              items={[
                'Batched writes to disk/database',
                'Async I/O (non-blocking)',
                'WAL (write-ahead log) pattern',
                'Flush every 1000 trades or 10ms'
              ]}
              color="bg-gray-700 text-white"
              icon={Database}
            />
          </div>

          <Box 
            title="Matching Engine (1 thread, P-Core 0)"
            items={[
              'Single-threaded: Deterministic order processing',
              'Dequeues orders from input queue',
              'Calls book.addOrder() - HOTPATH',
              'Calls algorithm.match() - uses book lookups',
              'Enqueues trades to output queue',
              'This is where we measure performance'
            ]}
            color="bg-red-700 text-white"
            codeKey="matching_engine"
          />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Box 
              title="Market Data Publisher (1 thread, P-Core 4)"
              items={[
                'Reads best bid/ask from order book',
                'Concurrent with matching thread',
                '10K reads per second',
                'UDP multicast to subscribers',
                'Latency requirement: < 10us'
              ]}
              color="bg-green-700 text-white"
              icon={Network}
            />

            <Box 
              title="GUI Updater (1 thread, E-Core 10)"
              items={[
                'Reads full order book depth',
                'Concurrent with matching thread',
                '10 reads per second',
                'Updates Qt visualization',
                'Latency requirement: < 1ms'
              ]}
              color="bg-green-700 text-white"
            />
          </div>

          <Box 
            title="Instrumentation (Lock-Free)"
            items={[
              'Per-thread RDTSC timestamps',
              'Lock-free ring buffers',
              'Measures: P50/P99/P99.9 latency',
              'CPU counters: cache misses, branches',
              'Minimal overhead (< 20ns per measurement)'
            ]}
            color="bg-indigo-700 text-white"
            codeKey="metrics"
          />

          <Box 
            title="Reader Thread Implementation"
            items={[
              'Market Data: Lightweight reads (best bid/ask only)',
              'GUI: Heavy reads (full depth snapshot)',
              'Both concurrent with matching thread writes',
              'This creates the reader/writer concurrency scenario'
            ]}
            color="bg-green-600 text-white"
            codeKey="readers"
          />
        </Section>

        <Section id="benchmark1" title="Benchmark #1: Order Book Data Structure" color="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-yellow-500">
          
          <div className="bg-yellow-900/40 border-2 border-yellow-400 rounded-lg p-4 mb-3">
            <div className="text-sm font-bold mb-2 text-yellow-200">Research Question</div>
            <div className="text-xs text-white">
              Which data structure minimizes order book operation latency under different workloads?
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-orange-900/30 border border-orange-500 rounded p-3">
              <div className="font-semibold text-sm mb-2 text-orange-200">Option A: std::map</div>
              <div className="text-xs text-white space-y-1">
                <div>Complexity: O(log n)</div>
                <div>Cache: Poor (tree pointers)</div>
                <div>Memory: Dynamic per node</div>
                <div>Predictability: Consistent</div>
              </div>
            </div>

            <div className="bg-orange-900/30 border border-orange-500 rounded p-3">
              <div className="font-semibold text-sm mb-2 text-orange-200">Option B: Skip List</div>
              <div className="text-xs text-white space-y-1">
                <div>Complexity: O(log n) prob</div>
                <div>Cache: Better (fewer levels)</div>
                <div>Memory: Dynamic, efficient</div>
                <div>Predictability: Probabilistic</div>
              </div>
            </div>

            <div className="bg-orange-900/30 border border-orange-500 rounded p-3">
              <div className="font-semibold text-sm mb-2 text-orange-200">Option C: Array-based</div>
              <div className="text-xs text-white space-y-1">
                <div>Complexity: O(1)</div>
                <div>Cache: Excellent (sequential)</div>
                <div>Memory: Fixed, sparse</div>
                <div>Predictability: Best</div>
              </div>
            </div>
          </div>

          <Box 
            title="Implementation Details"
            items={[
              'All implementations use same IOrderBook interface',
              'Matching engine code unchanged across tests',
              'Swapped at initialization in main()',
              'Each provides: addOrder, cancelOrder, getBest, getMatchable'
            ]}
            color="bg-yellow-700 text-white"
            codeKey="orderbook_interface"
          />

          <div className="mt-3 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <div className="text-xs font-bold mb-2 text-yellow-200">Test Methodology</div>
            <div className="text-xs space-y-2 text-white">
              <div className="font-semibold">Control Variables:</div>
              <div>Use same synchronization strategy (Coarse Lock baseline)</div>
              <div>Use same matching algorithm (Price-Time)</div>
              <div>Single-threaded matching (no concurrency complexity)</div>
              
              <div className="font-semibold mt-2">Vary Workload:</div>
              <div>Order arrival rate: 1K, 10K, 100K orders/sec</div>
              <div>Book depth: Sparse (10 levels) vs Dense (1000 levels)</div>
              <div>Cancel ratio: 0%, 50%, 90%</div>
              <div>Price distribution: Uniform vs Concentrated</div>
              
              <div className="font-semibold mt-2">Measure:</div>
              <div>Per-operation latency: addOrder, cancelOrder, match</div>
              <div>CPU cache misses (L1, L2, L3)</div>
              <div>Memory footprint and allocations</div>
            </div>
          </div>

          <div className="mt-3 bg-orange-900/30 border border-orange-600 rounded-lg p-4">
            <div className="text-xs font-bold mb-2 text-orange-200">Expected Results</div>
            <div className="text-xs space-y-1 text-white">
              <div>std::map: Baseline, consistent but slower, poor cache</div>
              <div>Skip List: 20-40% faster than map, better cache locality</div>
              <div>Array: 50-80% faster IF price range known, best cache</div>
              <div>Key insight: Cache locality matters more than algorithmic complexity</div>
            </div>
          </div>
        </Section>

        <Section id="benchmark2" title="Benchmark #2: Reader/Writer Synchronization" color="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500">
          
          <div className="bg-purple-900/40 border-2 border-purple-400 rounded-lg p-4 mb-3">
            <div className="text-sm font-bold mb-2 text-purple-200">Research Question</div>
            <div className="text-xs text-white">
              How do different synchronization strategies affect matching latency when readers access the order book concurrently?
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-pink-900/30 border border-pink-500 rounded p-3">
              <div className="font-semibold text-sm mb-2 text-pink-200">Option A: Coarse Lock</div>
              <div className="text-xs text-white space-y-1">
                <div>One mutex for entire book</div>
                <div>Writers block readers</div>
                <div>Readers block writers</div>
                <div>Simple, high contention</div>
              </div>
            </div>

            <div className="bg-pink-900/30 border border-pink-500 rounded p-3">
              <div className="font-semibold text-sm mb-2 text-pink-200">Option B: RCU</div>
              <div className="text-xs text-white space-y-1">
                <div>Copy-on-write for updates</div>
                <div>Readers never block</div>
                <div>Atomic pointer swap</div>
                <div>Memory overhead</div>
              </div>
            </div>
          </div>

          <Box 
            title="Implementation Details"
            items={[
              'Wraps any order book implementation',
              'Matching engine writes via addOrder/cancelOrder',
              'Market data reads via getBest',
              'GUI reads via getSnapshot',
              'Measure impact on matching latency'
            ]}
            color="bg-purple-700 text-white"
            codeKey="sync_wrapper"
          />

          <div className="mt-3 bg-indigo-900/40 border-2 border-indigo-400 rounded-lg p-4">
            <div className="text-sm font-bold mb-3 text-indigo-200">🤔 What is "Wrapping" and Why Do We Need It?</div>
            
            <div className="space-y-3">
              <div className="bg-indigo-800/50 rounded p-3">
                <div className="text-xs font-bold text-indigo-200 mb-2">The Problem</div>
                <div className="text-xs text-white space-y-1">
                  <div>• <strong>Benchmark #1:</strong> Single-threaded engine, no readers → NO synchronization needed</div>
                  <div>• <strong>Benchmark #2:</strong> Engine + multiple reader threads → NEED synchronization</div>
                  <div>• We want to benchmark SYNCHRONIZATION overhead separately from data structure overhead</div>
                  <div>• Solution: Take the SAME order book, add a "wrapper" that handles thread safety</div>
                </div>
              </div>

              <div className="bg-indigo-800/50 rounded p-3">
                <div className="text-xs font-bold text-indigo-200 mb-2">What is a Wrapper?</div>
                <div className="text-xs text-white space-y-2">
                  <div><strong>Wrapper = Decorator Pattern</strong></div>
                  <div>Think of it like:</div>
                  <div className="ml-3 space-y-1">
                    <div>1. You have a SkipListOrderBook (inner/core object)</div>
                    <div>2. You wrap it with CoarseLockOrderBook (outer/wrapper object)</div>
                    <div>3. Wrapper adds locks BEFORE/AFTER calling inner object's methods</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-700">
                    <strong>Analogy:</strong> Like putting a lock on a door. The door (order book) stays the same, but now you need a key (lock) to open it.
                  </div>
                </div>
              </div>

              <div className="bg-indigo-800/50 rounded p-3">
                <div className="text-xs font-bold text-indigo-200 mb-2">Code Flow Example</div>
                <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto mt-2">
{`// WITHOUT wrapper (Benchmark #1 - single threaded):
SkipListOrderBook book;
book.addOrder(order);  // Direct call, no locks needed

// WITH wrapper (Benchmark #2 - multi-threaded):
SkipListOrderBook inner_book;
CoarseLockOrderBook wrapper(inner_book);

// When engine calls:
wrapper.addOrder(order);
  -> lock mutex              // Wrapper adds this
  -> inner_book.addOrder()   // Delegate to inner book
  -> unlock mutex            // Wrapper adds this

// When reader calls:
wrapper.getBestBid();
  -> lock mutex              // Wrapper adds this  
  -> inner_book.getBestBid() // Delegate to inner book
  -> unlock mutex            // Wrapper adds this

// KEY POINT: SkipListOrderBook code is UNCHANGED!
// All synchronization is in the wrapper.`}</pre>
              </div>

              <div className="bg-indigo-800/50 rounded p-3">
                <div className="text-xs font-bold text-indigo-200 mb-2">Why This Design?</div>
                <div className="text-xs text-white space-y-1">
                  <div><strong>Separation of Concerns:</strong> Order book doesn't know about threads</div>
                  <div><strong>Reusability:</strong> Same order book works in both benchmarks</div>
                  <div><strong>Fair Comparison:</strong> Wrapper overhead measured separately</div>
                  <div><strong>Modularity:</strong> Swap wrappers (Coarse Lock → RCU) without changing book</div>
                  <div><strong>Clear Attribution:</strong> Slowdown is from sync, not data structure</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 bg-purple-900/30 border border-purple-600 rounded-lg p-4">
            <div className="text-xs font-bold mb-2 text-purple-200">Test Methodology</div>
            <div className="text-xs space-y-2 text-white">
              <div className="font-semibold">Control Variables:</div>
              <div>Use same order book (Skip List from Benchmark #1)</div>
              <div>Fixed matching engine throughput</div>
              
              <div className="font-semibold mt-2">Vary Load:</div>
              <div>Number of reader threads: 0, 1, 2, 5, 10</div>
              <div>Reader frequency: 10/sec, 1K/sec, 10K/sec</div>
              <div>Read type: Lightweight (getBest) vs Heavy (getSnapshot)</div>
              
              <div className="font-semibold mt-2">Measure:</div>
              <div>Matching engine latency degradation</div>
              <div>Reader latency (how fast can they read)</div>
              <div>CPU usage and context switches</div>
            </div>
          </div>

          <div className="mt-3 bg-pink-900/30 border border-pink-600 rounded-lg p-4">
            <div className="text-xs font-bold mb-2 text-pink-200">Expected Results</div>
            <div className="text-xs space-y-1 text-white">
              <div>Coarse Lock: Simple but matching slows 50% with 10 readers</div>
              <div>RCU: Matching unaffected by readers, but memory 2x and complex</div>
              <div>Trade-off: Simplicity vs Performance vs Memory</div>
              <div>Key insight: Read-heavy workloads need RCU, write-heavy can use locks</div>
            </div>
          </div>
        </Section>

        <Section id="testing" title="Testing Framework" color="bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500">
          
          <Box 
            title="Test Harness Design"
            items={[
              'Configurable: Swap order book and sync strategy independently',
              'Controlled load: Synthetic order generator',
              'Warmup phase: 30s to stabilize caches and JIT',
              'Measurement phase: 5 minutes per configuration',
              'Automated: Runs full benchmark matrix'
            ]}
            color="bg-green-700 text-white"
            codeKey="test_harness"
          />

          <div className="mt-3 bg-green-900/40 border-2 border-green-400 rounded-lg p-4">
            <div className="text-sm font-bold mb-3 text-green-200">Benchmark Matrix</div>
            <div className="text-xs space-y-3 text-white">
              
              <div>
                <div className="font-semibold text-green-300 mb-1">Benchmark #1: Order Book Structure (9 configs)</div>
                <div className="ml-3 space-y-1 text-gray-300">
                  <div>3 implementations × 3 workloads = 9 tests</div>
                  <div>Workloads: Low load, High load, High cancel rate</div>
                  <div>Sync: Coarse Lock (constant)</div>
                  <div>Readers: 0 (isolated test)</div>
                </div>
              </div>
              
              <div>
                <div className="font-semibold text-green-300 mb-1">Benchmark #2: Synchronization (10 configs)</div>
                <div className="ml-3 space-y-1 text-gray-300">
                  <div>2 sync strategies × 5 reader counts = 10 tests</div>
                  <div>Reader counts: 0, 1, 2, 5, 10 threads</div>
                  <div>Order book: Skip List (best from #1)</div>
                  <div>Workload: High load (constant)</div>
                </div>
              </div>
              
              <div>
                <div className="font-semibold text-green-300 mb-1">Total runtime: ~95 minutes</div>
                <div className="ml-3 text-gray-300">19 configurations × 5 minutes each</div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
              <div className="text-xs font-bold mb-2 text-green-200">Order Generator</div>
              <div className="text-xs space-y-1 text-white">
                <div>Poisson arrival process</div>
                <div>Configurable: Rate, price distribution</div>
                <div>Mix: 60% market orders, 40% limit orders</div>
                <div>Cancels: Configurable ratio</div>
                <div>Deterministic seed for reproducibility</div>
              </div>
            </div>
            
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
              <div className="text-xs font-bold mb-2 text-green-200">Metrics Collection</div>
              <div className="text-xs space-y-1 text-white">
                <div>RDTSC timestamps per order</div>
                <div>Store all samples (not just aggregates)</div>
                <div>Export to CSV for analysis</div>
                <div>perf counters: cache-misses, branches</div>
                <div>Overhead measured separately (&lt; 20ns)</div>
              </div>
            </div>
          </div>

          <div className="mt-3 bg-green-900/40 border-2 border-green-400 rounded-lg p-4">
            <div className="text-sm font-bold mb-3 text-green-200">Statistical Analysis</div>
            <div className="text-xs space-y-2 text-white">
              <div className="font-semibold">Per Configuration:</div>
              <div>Run 5 iterations, report median and 95% confidence interval</div>
              <div>Discard outliers (&gt; 3 standard deviations)</div>
              <div>Plot full latency distribution (not just percentiles)</div>
              
              <div className="font-semibold mt-2">Comparison:</div>
              <div>Baseline: std::map + Coarse Lock + 0 readers</div>
              <div>Report relative speedup (e.g., Skip List is 1.4x faster)</div>
              <div>Statistical significance: Mann-Whitney U test</div>
            </div>
          </div>
        </Section>

        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-3">Example Results Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Config</th>
                  <th className="text-left p-2">Order Book</th>
                  <th className="text-left p-2">Sync</th>
                  <th className="text-left p-2">Readers</th>
                  <th className="text-left p-2">P50 (ns)</th>
                  <th className="text-left p-2">P99 (ns)</th>
                  <th className="text-left p-2">Cache Miss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="bg-gray-700/30">
                  <td className="p-2">Baseline</td>
                  <td className="p-2">std::map</td>
                  <td className="p-2">Coarse</td>
                  <td className="p-2">0</td>
                  <td className="p-2">850</td>
                  <td className="p-2">2100</td>
                  <td className="p-2">12%</td>
                </tr>
                <tr>
                  <td className="p-2">B1-1</td>
                  <td className="p-2 text-yellow-300">Skip List</td>
                  <td className="p-2">Coarse</td>
                  <td className="p-2">0</td>
                  <td className="p-2 text-green-400">620</td>
                  <td className="p-2 text-green-400">1500</td>
                  <td className="p-2 text-green-400">7%</td>
                </tr>
                <tr>
                  <td className="p-2">B1-1</td>
                  <td className="p-2 text-yellow-300">Array</td>
                  <td className="p-2">Coarse</td>
                  <td className="p-2">0</td>
                  <td className="p-2 text-green-400">480</td>
                  <td className="p-2 text-green-400">980</td>
                  <td className="p-2 text-green-400">3%</td>
                </tr>
                <tr>
                  <td className="p-2">B2-1</td>
                  <td className="p-2">Skip List</td>
                  <td className="p-2">Coarse</td>
                  <td className="p-2 text-orange-400">5</td>
                  <td className="p-2 text-red-400">980</td>
                  <td className="p-2 text-red-400">3200</td>
                  <td className="p-2">8%</td>
                </tr>
                <tr>
                  <td className="p-2">B2-2</td>
                  <td className="p-2">Skip List</td>
                  <td className="p-2 text-purple-300">RCU</td>
                  <td className="p-2 text-orange-400">5</td>
                  <td className="p-2 text-green-400">640</td>
                  <td className="p-2 text-green-400">1550</td>
                  <td className="p-2">7%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Example shows: Skip List 27% faster than map, Array 44% faster. With 5 readers, Coarse Lock degrades 58%, RCU only 3%.
          </div>
        </div>

        <div className="mt-4 bg-amber-900/40 border-2 border-amber-500 rounded-lg p-4">
          <h3 className="text-amber-200 font-bold mb-3">Key Dissertation Contributions</h3>
          <div className="text-xs text-white space-y-2">
            <div>
              <span className="font-semibold text-amber-300">1. Order Book Structure:</span> 
              <span className="ml-2">Empirical comparison of std::map vs Skip List vs Array-based under realistic exchange workloads. Show that cache locality matters more than algorithmic complexity for modern CPUs.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-300">2. Reader/Writer Synchronization:</span> 
              <span className="ml-2">Quantify the impact of concurrent readers (market data, GUI) on matching latency. Demonstrate when RCU justifies its complexity vs simple locking.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-300">3. CPU Architecture Awareness:</span> 
              <span className="ml-2">Show the importance of thread pinning on heterogeneous cores (P-cores vs E-cores). Measure cache hierarchy effects with perf counters.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-300">4. Methodology:</span> 
              <span className="ml-2">Provide reproducible benchmark framework for exchange systems. Control for confounding variables, use proper statistics.</span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-cyan-900/40 border-2 border-cyan-400 rounded-lg p-4">
          <h3 className="text-cyan-200 font-bold mb-3">🖥️ Core Pinning Explained (Thread Affinity)</h3>
          <div className="space-y-3">
            <div className="bg-cyan-800/50 rounded p-3">
              <div className="font-semibold text-cyan-200 mb-2">What is Core Pinning?</div>
              <div className="text-xs text-white space-y-1">
                <div>• <strong>Core Pinning</strong> (Thread Affinity) = Forcing a thread to run on a specific CPU core</div>
                <div>• By default, OS scheduler moves threads between cores freely</div>
                <div>• In HFT/low-latency: We MANUALLY assign threads to specific cores</div>
                <div>• Example: <code className="text-green-300">pinThread(engineThread, coreID=0)</code> locks matching engine to Core 0</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyan-800/50 rounded p-3">
                <div className="font-semibold text-cyan-200 mb-2">Why Pin Threads?</div>
                <div className="text-xs text-white space-y-1">
                  <div><strong>Cache Locality:</strong> Keep hot data in L1/L2/L3 cache</div>
                  <div><strong>Predictable Performance:</strong> No context switches</div>
                  <div><strong>NUMA Awareness:</strong> Keep thread near its memory</div>
                  <div><strong>Avoid E-Cores:</strong> Critical threads stay on fast P-cores</div>
                  <div><strong>Reduce Jitter:</strong> No OS scheduler interference</div>
                </div>
              </div>

              <div className="bg-cyan-800/50 rounded p-3">
                <div className="font-semibold text-cyan-200 mb-2">M4 Mac: P-Cores vs E-Cores</div>
                <div className="text-xs text-white space-y-1">
                  <div><strong className="text-green-300">P-Cores (Performance):</strong></div>
                  <div>• Faster clock speed (~3.5GHz+)</div>
                  <div>• Larger caches (L1: 192KB, L2: 16MB)</div>
                  <div>• Out-of-order execution</div>
                  <div>• Use for: Matching engine, critical paths</div>
                  <div className="mt-2"><strong className="text-yellow-300">E-Cores (Efficiency):</strong></div>
                  <div>• Lower power, slower (~2.4GHz)</div>
                  <div>• Smaller caches</div>
                  <div>• Use for: Background tasks, logging</div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-800/50 rounded p-3">
              <div className="font-semibold text-cyan-200 mb-2">Code Example</div>
              <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto mt-2">
{`// macOS thread pinning API
void pinThread(std::thread& thread, int core_id) {
    thread_affinity_policy_data_t policy = { core_id };
    thread_port_t mach_thread = pthread_mach_thread_np(thread.native_handle());
    thread_policy_set(mach_thread, THREAD_AFFINITY_POLICY,
                     (thread_policy_t)&policy, 1);
}

// Usage in main.cpp:
std::thread engine_thread([&]() { engine.run(); });
pinThread(engine_thread, 0);  // Lock to P-Core 0 (fastest core)`}</pre>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-3">Technology Stack</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="font-semibold text-gray-300 mb-2">Core</div>
              <div className="space-y-1 text-gray-400">
                <div>C++20</div>
                <div>CMake build system</div>
                <div>std::atomic, std::thread</div>
                <div>macOS thread affinity API</div>
              </div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-300 mb-2">Libraries</div>
              <div className="space-y-1 text-gray-400">
                <div>Boost.Asio (network I/O)</div>
                <div>Qt6 (GUI)</div>
                <div>Google Benchmark (micro)</div>
                <div>spdlog (logging)</div>
              </div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-300 mb-2">Analysis</div>
              <div className="space-y-1 text-gray-400">
                <div>Python + pandas (stats)</div>
                <div>matplotlib (graphs)</div>
                <div>perf (CPU counters)</div>
                <div>Instruments (macOS profiling)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-green-900/40 border-2 border-green-400 rounded-lg p-4">
          <h3 className="text-green-200 font-bold mb-3">Success Criteria</h3>
          <div className="text-xs text-white space-y-2">
            <div>
              <span className="font-semibold">Functional:</span>
              <span className="ml-2">System processes 100K orders/sec with correct matching (verified against reference implementation)</span>
            </div>
            <div>
              <span className="font-semibold">Performance:</span>
              <span className="ml-2">P99 latency &lt; 2us for best configuration, measurable difference between implementations</span>
            </div>
            <div>
              <span className="font-semibold">Scientific:</span>
              <span className="ml-2">Results reproducible (&lt; 5% variance), statistically significant differences (p &lt; 0.05), confidence intervals reported</span>
            </div>
            <div>
              <span className="font-semibold">Dissertation:</span>
              <span className="ml-2">Clear research questions, controlled experiments, actionable insights for practitioners</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}