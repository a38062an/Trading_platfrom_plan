import { ArrowDown, ArrowRight, Database, Network, Users, Activity } from 'lucide-react';

export default function SystemArchitecture() {
  const FlowBox = ({ title, items, color = "bg-gray-700", icon: Icon }: any) => (
    <div className={`${color} rounded-lg p-4 border-2 border-white/20`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-5 h-5" />}
        <div className="font-bold text-sm">{title}</div>
      </div>
      <div className="text-xs space-y-1">
        {items.map((item: string, i: number) => <div key={i}>• {item}</div>)}
      </div>
    </div>
  );

  const Arrow = ({ text, vertical = false }: { text: string; vertical?: boolean }) => (
    <div className={`flex items-center justify-center ${vertical ? 'flex-col py-2' : 'px-2'}`}>
      {vertical ? <ArrowDown className="w-6 h-6 text-blue-400" /> : <ArrowRight className="w-6 h-6 text-blue-400" />}
      <span className="text-xs text-blue-300 font-semibold mt-1">{text}</span>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
          System Architecture & Data Flow
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 lg:mb-8">
          Multi-threaded exchange system with shared order book synchronization
        </p>

        {/* Core Problem Statement */}
        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-red-500">
          <h2 className="text-xl sm:text-2xl font-bold text-red-200 mb-3 sm:mb-4">The Central Problem: Shared Order Book Contention</h2>
          <div className="bg-red-900/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-white space-y-2 sm:space-y-3">
              <div><strong>Core Issue:</strong> Multiple threads need to access the same order book simultaneously</div>
              <div><strong>Writer Thread:</strong> Matching engine needs exclusive access to modify order book (add/cancel/match orders)</div>
              <div><strong>Reader Threads:</strong> Market data publishers, GUI, risk systems need to read current state without blocking the writer</div>
              <div><strong>Challenge:</strong> Traditional locks serialize all access, killing performance. Lock-free structures are complex and have subtle bugs.</div>
              <div><strong>Trade-off:</strong> Writer latency vs reader freshness vs implementation complexity</div>
            </div>
          </div>
        </div>

        {/* Complete Data Flow */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-cyan-500">
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-300 mb-4 sm:mb-6">Complete Order Processing Flow</h2>
          
          <div className="space-y-2 sm:space-y-3">
            {/* Client */}
            <div>
              <FlowBox 
                title="Trading Clients (External)"
                items={[
                  "Institutional traders, algorithmic bots",
                  "Send orders via network (TCP/FIX protocol)",
                  "Example: Buy 100 AAPL @ $150.25"
                ]}
                color="bg-purple-700 text-white"
                icon={Users}
              />
            </div>

            <Arrow text="TCP/FIX Messages" vertical />

            {/* Market Data Receiver */}
            <div>
              <FlowBox 
                title="Market Data Receiver (Async I/O Thread Pool)"
                items={[
                  "Threading: Boost.Asio event loop, 2-4 worker threads",
                  "Receives and validates incoming orders",
                  "Parses FIX messages to internal Order objects",
                  "Non-blocking enqueue to input queue"
                ]}
                color="bg-green-700 text-white"
                icon={Network}
              />
            </div>

            <Arrow text="inputQueue.enqueue(order) - Lock-free SPSC" vertical />

            {/* Input Queue */}
            <div className="bg-indigo-900/40 border-2 border-indigo-400 rounded-lg p-4">
              <div className="text-sm font-bold text-indigo-200 mb-2">Input Queue (Lock-Free SPSC)</div>
              <div className="text-xs text-white space-y-1">
                <div>• Single Producer (Market Receiver) → Single Consumer (Matching Engine)</div>
                <div>• Implementation: Boost.lockfree::spsc_queue or folly::ProducerConsumerQueue</div>
                <div>• Purpose: Decouple async I/O from deterministic matching logic</div>
                <div>• NOT the bottleneck - SPSC queues are trivially fast (~10ns latency)</div>
              </div>
            </div>

            <Arrow text="matchingEngine.dequeue() - Non-blocking" vertical />

            {/* Matching Engine + Metrics */}
            <div className="bg-red-900/40 border-2 border-red-400 rounded-lg p-4">
              <div className="text-lg font-bold text-red-200 mb-3">Matching Engine (Single Thread, P-Core Pinned)</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                <div className="bg-red-800/50 rounded p-3">
                  <div className="text-sm font-bold text-red-200 mb-2">Core Components</div>
                  <div className="text-xs text-white space-y-1">
                    <div>• Order Book (THE BOTTLENECK)</div>
                    <div>• Matching Algorithm</div>
                    <div>• MetricsCollector (inline instrumentation)</div>
                  </div>
                </div>
                <div className="bg-red-800/50 rounded p-3">
                  <div className="text-sm font-bold text-red-200 mb-2">Processing Loop</div>
                  <pre className="text-xs text-green-300 font-mono">
{`while (running) {
  auto start = rdtsc();
  
  Order order;
  if (!inputQueue.dequeue(order))
    continue;
  
  orderBook.insert(order);
  auto trades = algo.match();
  
  for (auto& trade : trades) {
    tradeQueue.enqueue(trade);
  }
  
  auto end = rdtsc();
  metrics.record(end - start);
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded p-3">
                <div className="text-sm font-bold text-yellow-200 mb-2">THIS IS THE BOTTLENECK: Order Book Access</div>
                <div className="text-xs text-white space-y-1">
                  <div><strong>Writer (this thread):</strong> Needs to insert/remove/match orders (~1μs per operation)</div>
                  <div><strong>Readers (other threads):</strong> Market data publishers need getBestBid/Ask() ~10K times/sec</div>
                  <div><strong>Problem:</strong> How to allow concurrent reads without blocking the writer?</div>
                </div>
              </div>
            </div>

            <Arrow text="tradeQueue.enqueue(trade) - Lock-free SPMC" vertical />

            {/* Trade Queue */}
            <div className="bg-purple-900/40 border-2 border-purple-400 rounded-lg p-4">
              <div className="text-sm font-bold text-purple-200 mb-2">Trade Queue (Lock-Free SPMC)</div>
              <div className="text-xs text-white space-y-1">
                <div>• Single Producer (Matching Engine) → Multiple Consumers (Persistence, GUI observers)</div>
                <div>• Implementation: Boost.lockfree::queue or moodycamel::ConcurrentQueue</div>
                <div>• Purpose: Decouple trade execution from persistence/distribution</div>
                <div>• Contains: Trade records with timestamps, prices, quantities</div>
              </div>
            </div>

            <Arrow text="persistence.dequeue() - Non-blocking" vertical />

            {/* Persistence */}
            <div>
              <FlowBox 
                title="Persistence Worker (Background Thread)"
                items={[
                  "Threading: Single background thread",
                  "Dequeues trades and writes to database/logs",
                  "PostgreSQL for structured data, CSV for audit trail",
                  "Blocking I/O is acceptable (off critical path)"
                ]}
                color="bg-orange-700 text-white"
                icon={Database}
              />
            </div>

            {/* Parallel Readers */}
            <div className="mt-6 bg-blue-900/40 border-2 border-blue-400 rounded-lg p-4">
              <div className="text-base sm:text-lg font-bold text-blue-200 mb-3">Concurrent Reader Threads (Parallel Path)</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <FlowBox 
                  title="Market Data Publishers"
                  items={[
                    "Threading: 2-3 reader threads",
                    "Read orderBook.getBestBid/Ask() every 100μs",
                    "Broadcast to subscribers via multicast",
                    "MUST NOT block matching engine"
                  ]}
                  color="bg-blue-700 text-white"
                  icon={Network}
                />
                <FlowBox 
                  title="GUI / Risk Monitors"
                  items={[
                    "Threading: Qt main thread + risk thread",
                    "Read orderBook.getSnapshot() every 16ms",
                    "Display order book depth, market stats",
                    "Can tolerate slightly stale data"
                  ]}
                  color="bg-blue-700 text-white"
                  icon={Activity}
                />
              </div>
              <div className="mt-3 text-xs text-yellow-300 font-semibold text-center">
                These threads READ from order book concurrently with the writer → Need synchronization strategy
              </div>
            </div>
          </div>
        </div>

        {/* Synchronization Strategies */}
        <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-amber-500">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-200 mb-3 sm:mb-4">Synchronization Strategies Compared</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-amber-800/50 rounded-lg p-4">
              <h4 className="font-bold text-amber-200 mb-2">Coarse-Grained Locking</h4>
              <div className="text-xs text-white space-y-2">
                <div><strong>Mechanism:</strong> Single std::mutex guards entire order book</div>
                <div><strong>Writer:</strong> Lock → modify → unlock</div>
                <div><strong>Reader:</strong> Lock → read → unlock</div>
                <div className="pt-2 border-t border-amber-700">
                  <div className="text-green-300"><strong>Pros:</strong> Simple, correct by construction</div>
                  <div className="text-green-300 ml-4">Easy to debug and reason about</div>
                  <div className="text-red-300 mt-1"><strong>Cons:</strong> Serializes all access</div>
                  <div className="text-red-300 ml-4">Writers blocked by readers</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-800/50 rounded-lg p-4">
              <h4 className="font-bold text-amber-200 mb-2">RCU (Read-Copy-Update)</h4>
              <div className="text-xs text-white space-y-2">
                <div><strong>Mechanism:</strong> Readers see consistent snapshot, writer makes copy</div>
                <div><strong>Writer:</strong> Copy → modify → atomic pointer swap</div>
                <div><strong>Reader:</strong> Load pointer → read (no locks)</div>
                <div className="pt-2 border-t border-amber-700">
                  <div className="text-green-300"><strong>Pros:</strong> Readers never block writer</div>
                  <div className="text-green-300 ml-4">Wait-free reads</div>
                  <div className="text-red-300 mt-1"><strong>Cons:</strong> 2x memory (old + new copy)</div>
                  <div className="text-red-300 ml-4">Write amplification (copy entire book)</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-800/50 rounded-lg p-4">
              <h4 className="font-bold text-amber-200 mb-2">Versioned Snapshots</h4>
              <div className="text-xs text-white space-y-2">
                <div><strong>Mechanism:</strong> Store top-N snapshots with version numbers</div>
                <div><strong>Writer:</strong> Lock → modify → publish version → unlock</div>
                <div><strong>Reader:</strong> Read latest stable version (lock-free)</div>
                <div className="pt-2 border-t border-amber-700">
                  <div className="text-green-300"><strong>Pros:</strong> Readers don't block writer</div>
                  <div className="text-green-300 ml-4">Bounded memory overhead</div>
                  <div className="text-red-300 mt-1"><strong>Cons:</strong> Readers may see stale data</div>
                  <div className="text-red-300 ml-4">Snapshot generation overhead</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testing & Metrics */}
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-4 sm:p-6 border-2 border-green-500">
          <h2 className="text-xl sm:text-2xl font-bold text-green-200 mb-3 sm:mb-4">Testing Framework & Metrics Collection</h2>
          
          <div className="space-y-3 sm:space-y-4">
            {/* RDTSC Explanation */}
            <div className="bg-green-800/50 rounded-lg p-4">
              <h3 className="text-base sm:text-lg font-bold text-green-200 mb-3">What is RDTSC?</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Explanation</div>
                  <div className="text-xs text-white space-y-2">
                    <div><strong>RDTSC</strong> = "Read Time-Stamp Counter"</div>
                    <div>• CPU instruction that reads a 64-bit counter</div>
                    <div>• Counter increments every CPU cycle (~3.5 billion/sec on M4)</div>
                    <div>• <strong>Why use it?</strong> Nanosecond precision, ~5ns overhead (vs 50ns for clock_gettime)</div>
                    <div>• <strong>__asm__ volatile:</strong> Inline assembly, prevents compiler reordering</div>
                    <div>• Returns TSC value in two 32-bit registers (lo, hi)</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Code Breakdown</div>
                  <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto">
{`inline uint64_t rdtsc() {
    unsigned int lo, hi;
    
    // Inline assembly instruction
    __asm__ __volatile__ (
        "rdtsc"           // x86 instruction
        : "=a" (lo),      // Output: lo in EAX
          "=d" (hi)       // Output: hi in EDX
    );
    
    // Combine into 64-bit value
    return ((uint64_t)hi << 32) | lo;
}

// Convert cycles to nanoseconds:
// cycles / (CPU_GHz) = nanoseconds
// e.g., 3500 cycles / 3.5 GHz = 1000ns`}
                  </pre>
                </div>
              </div>
            </div>

            {/* MetricsCollector Integration */}
            <div className="bg-green-800/50 rounded-lg p-4">
              <h3 className="text-base sm:text-lg font-bold text-green-200 mb-3">Where Does MetricsCollector Live?</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Architecture</div>
                  <div className="text-xs text-white space-y-2">
                    <div><strong>Location:</strong> Member variable inside MatchingEngine class</div>
                    <div><strong>Lifetime:</strong> Created in main(), passed to engine constructor</div>
                    <div><strong>Access:</strong> Only matching engine thread writes to it (lock-free)</div>
                    <div><strong>Export:</strong> Separate reporter thread reads and exports to CSV every 1 second</div>
                    <div><strong>Key Point:</strong> Inline instrumentation means measurements happen ON the critical path but with minimal overhead (&lt;10ns per sample)</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Usage in Matching Engine</div>
                  <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto">
{`class MatchingEngine {
private:
    OrderBook& orderBook_;
    MetricsCollector& metrics_;
    
public:
    void processOrder(const Order& o) {
        // Start timer
        uint64_t start = rdtsc();
        
        // Critical path work
        orderBook_.insert(o);
        auto trades = match();
        
        // Stop timer
        uint64_t end = rdtsc();
        
        // Record (lock-free atomic increment)
        metrics_.recordLatency(end - start);
        metrics_.incrementOrders();
    }
};`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-green-800/50 rounded-lg p-4">
              <h3 className="text-base sm:text-lg font-bold text-green-200 mb-3">MetricsCollector Implementation</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Lock-Free Design</div>
                  <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto">
{`class MetricsCollector {
private:
    // Atomics for counters
    std::atomic<uint64_t> order_count{0};
    std::atomic<uint64_t> trade_count{0};
    
    // Ring buffer for latency samples
    // (lock-free SPSC queue)
    folly::ProducerConsumerQueue<
        uint64_t
    > latency_samples(10'000);
    
public:
    // Called by matching engine
    void recordLatency(uint64_t cycles) {
        // Non-blocking write
        latency_samples.write(cycles);
    }
    
    void incrementOrders() {
        order_count.fetch_add(1, 
            std::memory_order_relaxed);
    }
};`}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-200 mb-2">Separate Reporter Thread</div>
                  <pre className="text-xs bg-black/40 p-3 rounded text-green-300 overflow-x-auto">
{`// Runs in background, reads metrics
class MetricsReporter {
public:
    void run() {
        while (running) {
            sleep(1s);
            
            // Read atomics
            auto orders = 
                metrics.getOrders();
            
            // Drain latency queue
            std::vector<uint64_t> samples;
            metrics.readLatencies(samples);
            
            // Compute percentiles
            auto p50 = percentile(50);
            auto p99 = percentile(99);
            
            // Export to CSV
            csv << orders << p50 << p99;
        }
    }
};`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-green-800/50 rounded-lg p-4">
              <h3 className="font-bold text-green-200 mb-3">Test Harness Architecture</h3>
              <div className="text-xs text-white space-y-2">
                <div><strong>Order Generator:</strong> Synthetic workload with configurable arrival rate, order size distribution, cancel rate</div>
                <div><strong>Warmup Phase:</strong> 10 seconds to stabilize caches and JIT, discard measurements</div>
                <div><strong>Measurement Phase:</strong> 60 seconds of sustained load, record all samples</div>
                <div><strong>Cooldown Phase:</strong> Drain queues, finalize metrics, export to CSV</div>
                <div><strong>Iterations:</strong> Run 5x per configuration, report median + confidence intervals</div>
                <div><strong>Isolation:</strong> Disable turbo boost, pin threads, close background apps</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
