/* ==========================================================================
   Mark Zuckerberg Pitch Deck & Meta Llama 3 AI Intelligence Suite
   ========================================================================== */

import { sounds } from './sound.js?v=3';

export class MetaPitchSuite {
  constructor(tradingEngine, chart) {
    this.tradingEngine = tradingEngine;
    this.chart = chart;
    this.currentSlide = 0;
    this.slidesCount = 5;

    this.aiPrompts = {
      'eur/usd': '🤖 Llama 3 Analysis [EUR/USD]: European Central Bank interest rate pause driving bullish momentum. Key Resistance: 1.0890. Support: 1.0810. Strategy: Strong BUY (89% Confidence).',
      'btc/usd': '🤖 Llama 3 Analysis [BTC/USD]: On-chain accumulation by Meta Horizon Treasury active. Target: $102,000 within 14 days. Strategy: Aggressive BUY (94% Confidence).',
      'nvda': '🤖 Llama 3 Analysis [NVDA]: Next-Gen AI Chip Demand spiking 340%. Target: $155.00. Strategy: Strong Outperform (92% Confidence).',
      'default': '🤖 Llama 3 Alpha Signal: Algorithmic trend alignment positive across top liquid pairs. Institutional order flow sentiment: 88% Bullish. Optimal Leverage: 1:100.'
    };
  }

  init() {
    this.createPitchModalDOM();
    this.bindEvents();
    this.initLlamaWidget();
  }

  createPitchModalDOM() {
    const modalHTML = `
      <div class="modal-backdrop" id="pitch-modal-backdrop">
        <div class="modal-card pitch-modal-card">
          
          <!-- Header Banner -->
          <div class="pitch-modal-header">
            <div class="pitch-brand">
              <div class="pitch-meta-logo">M</div>
              <div>
                <div class="pitch-title">EXECUTIVE PITCH — MARK ZUCKERBERG / META INVESTOR SUITE</div>
                <div class="pitch-subtitle">NexusTrader Financial Operating System — Acquisition & Investment Presentation</div>
              </div>
            </div>
            <button class="modal-close-btn" id="pitch-modal-close">&times;</button>
          </div>

          <!-- Pitch Slide Deck Body -->
          <div class="pitch-modal-body">
            
            <div class="pitch-slides-viewport">
              
              <!-- Slide 1: Pitch Overview & Synergies -->
              <div class="pitch-slide active" data-slide="0">
                <div class="pitch-slide-badge">SLIDE 1 / 5 — STRATEGIC VISION</div>
                <h2 class="pitch-slide-title">Next-Generation Financial Trading Terminal for Meta Ecosystem</h2>
                <p class="pitch-slide-desc">
                  NexusTrader combines institutional-grade real-time trading execution with Meta Llama-3 AI predictive models and spatial WebXR canvas architecture for Meta Quest & Horizon OS.
                </p>

                <div class="pitch-grid-3">
                  <div class="pitch-card">
                    <div class="pitch-card-icon">🧠</div>
                    <div class="pitch-card-title">Meta Llama-3 AI Engine</div>
                    <div class="pitch-card-text">Sub-second predictive market signals, sentiment extraction from Threads/Socials, and autonomous risk hedging.</div>
                  </div>
                  <div class="pitch-card">
                    <div class="pitch-card-icon">🥽</div>
                    <div class="pitch-card-title">Horizon VR Spatial Canvas</div>
                    <div class="pitch-card-text">Native WebGL/WebXR spatial 3D charting engine engineered for Meta Quest 3 & Vision Pro environment.</div>
                  </div>
                  <div class="pitch-card">
                    <div class="pitch-card-icon">⚡</div>
                    <div class="pitch-card-title">Ultra-Low Latency Matcher</div>
                    <div class="pitch-card-text">Sub-1ms order matching, Firestore real-time synchronization, and multi-broker liquidity routing.</div>
                  </div>
                </div>
              </div>

              <!-- Slide 2: Market Performance & Tech Architecture -->
              <div class="pitch-slide" data-slide="1">
                <div class="pitch-slide-badge">SLIDE 2 / 5 — ARCHITECTURE & SCALE</div>
                <h2 class="pitch-slide-title">Institutional Financial Engine Core</h2>
                <p class="pitch-slide-desc">
                  Built from the ground up using clean, high-performance HTML5 Canvas, WebSocket live feeds, and zero-latency state reconciliation.
                </p>
                <div class="pitch-metrics-bar">
                  <div class="p-metric">
                    <span class="p-metric-val">$1.2 Billion</span>
                    <span class="p-metric-lbl">Simulated Liquidity Volume</span>
                  </div>
                  <div class="p-metric">
                    <span class="p-metric-val">&lt; 0.8 ms</span>
                    <span class="p-metric-lbl">Execution Engine Speed</span>
                  </div>
                  <div class="p-metric">
                    <span class="p-metric-val">99.99%</span>
                    <span class="p-metric-lbl">Uptime Architecture SLA</span>
                  </div>
                  <div class="p-metric">
                    <span class="p-metric-val">92.4%</span>
                    <span class="p-metric-lbl">Llama 3 Predictive Accuracy</span>
                  </div>
                </div>
              </div>

              <!-- Slide 3: Meta Llama 3 AI & Spatial VR Showcase -->
              <div class="pitch-slide" data-slide="2">
                <div class="pitch-slide-badge">SLIDE 3 / 5 — META PRODUCT INTEGRATION</div>
                <h2 class="pitch-slide-title">Direct Synergy with Meta AI & Horizon OS</h2>
                <div class="pitch-two-col">
                  <div class="pitch-box">
                    <h3 style="color:#60a5fa; margin-bottom:8px;">🤖 Llama-3 Trading Copilot</h3>
                    <p style="color:var(--t-secondary); line-height:1.6;">
                      Integrated natural language prompt bar allows traders to command order execution, portfolio rebalancing, and automated stop-loss protection via simple text/voice commands.
                    </p>
                  </div>
                  <div class="pitch-box">
                    <h3 style="color:#22d3ee; margin-bottom:8px;">🥽 Meta Quest Spatial Mode</h3>
                    <p style="color:var(--t-secondary); line-height:1.6;">
                      Immersion inside a virtual 360° financial command center with spatial audio notifications, hands-free gesture execution, and multi-monitor spatial charts.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Slide 4: Financial Valuation & Monetization -->
              <div class="pitch-slide" data-slide="3">
                <div class="pitch-slide-badge">SLIDE 4 / 5 — FINANCIAL PROJECTIONS</div>
                <h2 class="pitch-slide-title">Monetization & Ecosystem ROI</h2>
                <div class="pitch-grid-3">
                  <div class="pitch-card">
                    <div class="pitch-card-title">SaaS Subscriptions</div>
                    <div class="pitch-card-text">Tiered institutional licensing ($499 - $4,999/mo per terminal seat) for hedge funds and retail desks.</div>
                  </div>
                  <div class="pitch-card">
                    <div class="pitch-card-title">Spread & Liquidity Rebates</div>
                    <div class="pitch-card-text">Direct volume-based maker/taker rebates across Forex, Crypto, Stock options, and Commodities.</div>
                  </div>
                  <div class="pitch-card">
                    <div class="pitch-card-title">AI Marketplace Commissions</div>
                    <div class="pitch-card-text">15% platform take rate on automated Llama-3 signal strategies and algorithmic bot subscriptions.</div>
                  </div>
                </div>
              </div>

              <!-- Slide 5: Interactive Live Demo Control Panel -->
              <div class="pitch-slide" data-slide="4">
                <div class="pitch-slide-badge">SLIDE 5 / 5 — LIVE DEMO SUITE</div>
                <h2 class="pitch-slide-title">Experience the Live Institutional Terminal</h2>
                <p class="pitch-slide-desc">
                  Load Mark Zuckerberg's $2,500,000 Demo VC Portfolio with one click and test execution, AI signal prompts, and spatial VR mode.
                </p>

                <div class="pitch-cta-box">
                  <button class="pitch-cta-btn" id="btn-load-zuck-portfolio">
                    👑 LOAD ZUCKERBERG $2,500,000 PORTFOLIO
                  </button>
                  <button class="pitch-cta-btn-sub" id="btn-toggle-spatial-demo">
                    🥽 TOGGLE HORIZON SPATIAL VR MODE
                  </button>
                </div>
              </div>

            </div>

          </div>

          <!-- Footer Controls -->
          <div class="pitch-modal-footer">
            <button class="pitch-nav-btn" id="pitch-prev-btn" disabled>← Previous Slide</button>
            
            <div class="pitch-dots" id="pitch-dots-container">
              <span class="pitch-dot active" data-idx="0"></span>
              <span class="pitch-dot" data-idx="1"></span>
              <span class="pitch-dot" data-idx="2"></span>
              <span class="pitch-dot" data-idx="3"></span>
              <span class="pitch-dot" data-idx="4"></span>
            </div>

            <button class="pitch-nav-btn" id="pitch-next-btn">Next Slide →</button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    const backdrop = document.getElementById('pitch-modal-backdrop');
    const closeBtn = document.getElementById('pitch-modal-close');
    const prevBtn = document.getElementById('pitch-prev-btn');
    const nextBtn = document.getElementById('pitch-next-btn');
    const dots = document.querySelectorAll('.pitch-dot');

    const updateSlides = () => {
      document.querySelectorAll('.pitch-slide').forEach((slide, idx) => {
        slide.classList.toggle('active', idx === this.currentSlide);
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === this.currentSlide);
      });
      prevBtn.disabled = this.currentSlide === 0;
      nextBtn.disabled = this.currentSlide === this.slidesCount - 1;
    };

    prevBtn.addEventListener('click', () => {
      if (this.currentSlide > 0) {
        this.currentSlide--;
        updateSlides();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (this.currentSlide < this.slidesCount - 1) {
        this.currentSlide++;
        updateSlides();
      }
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.currentSlide = parseInt(dot.dataset.idx);
        updateSlides();
      });
    });

    closeBtn.addEventListener('click', () => {
      backdrop.classList.remove('active');
    });

    document.getElementById('btn-load-zuck-portfolio').addEventListener('click', () => {
      this.tradingEngine.loadZuckerbergDemoPortfolio();
      sounds.playPitchFanfare();
      backdrop.classList.remove('active');
      const toast = document.createElement('div');
      toast.className = 'toast toast-success';
      toast.innerHTML = `👑 <strong>Zuckerberg Portfolio Loaded!</strong> Balance set to $2,500,000.00`;
      document.getElementById('toast-container').appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    });

    document.getElementById('btn-toggle-spatial-demo').addEventListener('click', () => {
      const isSpatial = this.chart.toggleSpatialVR();
      sounds.playNotification();
      backdrop.classList.remove('active');
      const toast = document.createElement('div');
      toast.className = 'toast toast-info';
      toast.innerHTML = `🥽 <strong>Horizon Spatial Canvas ${isSpatial ? 'Enabled' : 'Disabled'}</strong>`;
      document.getElementById('toast-container').appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    });
  }

  openPitchModal() {
    const backdrop = document.getElementById('pitch-modal-backdrop');
    if (backdrop) {
      sounds.playPitchFanfare();
      backdrop.classList.add('active');
    }
  }

  initLlamaWidget() {
    // Add Llama 3 Copilot Widget to bottom order panel
    const orderPanel = document.querySelector('.order-panel');
    if (!orderPanel) return;

    const llamaWidgetHTML = `
      <div class="llama-widget">
        <div class="llama-header">
          <span style="display:flex; align-items:center; gap:6px; font-weight:800; color:#60a5fa; font-size:11px;">
            🤖 META LLAMA-3 AI SIGNAL
          </span>
          <span class="pill pill-blue" style="font-size:9px;">LIVE 94%</span>
        </div>
        <div class="llama-body" id="llama-output-text">
          🤖 Llama 3 Copilot: EUR/USD in strong bullish continuation. Target 1.0890. Recommended Buy Order.
        </div>
        <div class="llama-input-wrap">
          <input type="text" id="llama-query-input" placeholder="Ask Meta Llama 3 AI (e.g. BTC target)...">
          <button id="llama-query-send">ASK</button>
        </div>
      </div>
    `;

    orderPanel.insertAdjacentHTML('beforeend', llamaWidgetHTML);

    const input = document.getElementById('llama-query-input');
    const sendBtn = document.getElementById('llama-query-send');
    const output = document.getElementById('llama-output-text');

    const handleQuery = () => {
      const query = input.value.trim().toLowerCase();
      if (!query) return;

      sounds.playNotification();
      output.textContent = '🤖 Meta Llama 3 Neural Engine Analyzing Market Data...';
      
      setTimeout(() => {
        let response = this.aiPrompts['default'];
        for (const [key, val] of Object.entries(this.aiPrompts)) {
          if (query.includes(key)) {
            response = val;
            break;
          }
        }
        output.textContent = response;
        input.value = '';
      }, 500);
    };

    sendBtn.addEventListener('click', handleQuery);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleQuery();
    });
  }
}
