/* ==========================================================================
   NEXUS FINANCIAL CHARTING ENGINE (HTML5 Canvas 2D)
   Institutional Grade Candlestick & Line Visualization Engine
   ========================================================================== */

export class TradingChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.candles = [];
    this.chartType = 'candlestick'; // 'candlestick' or 'line'
    this.timeframe = '1M';
    this.currentSymbol = 'EUR/USD';
    this.showSMA = true;
    this.showVolume = true;
    this.spatialVR = false;

    this.mousePos = { x: -1, y: -1, isHover: false };

    this.initCanvasResize();
    this.initEventListeners();
  }

  toggleSpatialVR(enabled) {
    this.spatialVR = enabled !== undefined ? enabled : !this.spatialVR;
    this.render();
    return this.spatialVR;
  }

  initCanvasResize() {
    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
      this.render();
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  initEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
      this.mousePos.isHover = true;
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos.isHover = false;
      this.render();
    });
  }

  setCandles(candles, symbol) {
    this.candles = candles;
    this.currentSymbol = symbol;
    this.render();
  }

  setChartType(type) {
    this.chartType = type;
    this.render();
  }

  setTimeframe(tf) {
    this.timeframe = tf;
    this.render();
  }

  toggleSMA(show) {
    this.showSMA = show;
    this.render();
  }

  render() {
    if (!this.canvas || !this.ctx || this.candles.length === 0) return;

    const width = this.cssWidth || this.canvas.width;
    const height = this.cssHeight || this.canvas.height;
    const ctx = this.ctx;

    // Clear Deep Background
    ctx.fillStyle = this.spatialVR ? '#020716' : '#040912';
    ctx.fillRect(0, 0, width, height);

    if (this.spatialVR) {
      // Spatial VR Grid Lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Cybernetic Hologram Overlay Text
      ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
      ctx.font = '800 13px "Outfit", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🥽 META HORIZON SPATIAL TERMINAL V3.4 — SPATIAL CANVAS ACTIVE', width - 85, 26);
    }

    // Layout Dimensions
    const paddingRight = 72;
    const paddingBottom = 24;
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom;
    const volumeHeight = chartHeight * 0.18; // Bottom 18% for volume

    // Calculate Min & Max Price
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const c of this.candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    const margin = (maxPrice - minPrice) * 0.08 || 0.001;
    minPrice -= margin;
    maxPrice += margin;
    const priceRange = maxPrice - minPrice;

    const getY = (price) => {
      const availableH = chartHeight - (this.showVolume ? volumeHeight : 0);
      return availableH - ((price - minPrice) / priceRange) * availableH;
    };

    // Draw Subtle Grid Network
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';

    const rows = 7;
    for (let i = 0; i <= rows; i++) {
      const y = ((chartHeight - (this.showVolume ? volumeHeight : 0)) / rows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Right Y-Axis Price Label
      const priceVal = maxPrice - (i / rows) * priceRange;
      const digits = this.currentSymbol.includes('JPY') || this.currentSymbol.includes('BTC') ? 2 : 5;
      
      ctx.fillStyle = '#4a5a70';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceVal.toFixed(digits), chartWidth + 10, y + 4);
    }

    // Candle Dimensions
    const candleCount = this.candles.length;
    const candleWidth = chartWidth / candleCount;
    const bodyWidth = Math.max(candleWidth * 0.65, 3);

    // Render Volume Bars Histogram (Bottom Area)
    if (this.showVolume) {
      let maxVol = 0;
      this.candles.forEach(c => {
        const v = Math.abs(c.close - c.open) * 1000 + (c.high - c.low) * 500;
        if (v > maxVol) maxVol = v;
      });

      for (let i = 0; i < candleCount; i++) {
        const c = this.candles[i];
        const isBull = c.close >= c.open;
        const x = i * candleWidth + candleWidth / 2;
        const vol = Math.abs(c.close - c.open) * 1000 + (c.high - c.low) * 500;
        const vBarH = (vol / (maxVol || 1)) * volumeHeight * 0.85;

        ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(x - bodyWidth / 2, chartHeight - vBarH, bodyWidth, vBarH);
      }
    }

    // SMA 20 (Simple Moving Average overlay)
    if (this.showSMA) {
      const sma20 = [];
      for (let i = 0; i < candleCount; i++) {
        if (i < 19) {
          sma20.push(null);
        } else {
          const sum = this.candles.slice(i - 19, i + 1).reduce((acc, c) => acc + c.close, 0);
          sma20.push(sum / 20);
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 8;
      let smaStarted = false;

      for (let i = 0; i < candleCount; i++) {
        const val = sma20[i];
        if (val !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(val);
          if (!smaStarted) {
            ctx.moveTo(x, y);
            smaStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Chart Content (Line vs Candlestick)
    if (this.chartType === 'line') {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;

      for (let i = 0; i < candleCount; i++) {
        const c = this.candles[i];
        const x = i * candleWidth + candleWidth / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Area Fill Gradient
      const lineGrad = ctx.createLinearGradient(0, 0, 0, chartHeight);
      lineGrad.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
      lineGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

      ctx.lineTo(chartWidth, chartHeight);
      ctx.lineTo(0, chartHeight);
      ctx.closePath();
      ctx.fillStyle = lineGrad;
      ctx.fill();

    } else {
      // Candlesticks Render
      for (let i = 0; i < candleCount; i++) {
        const c = this.candles[i];
        const x = i * candleWidth + candleWidth / 2;
        const isBullish = c.close >= c.open;

        const mainColor = isBullish ? '#10b981' : '#ef4444';
        ctx.strokeStyle = mainColor;
        ctx.fillStyle = mainColor;

        // Wick
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, getY(c.high));
        ctx.lineTo(x, getY(c.low));
        ctx.stroke();

        // Body
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const bodyY = Math.min(openY, closeY);
        const bodyH = Math.max(Math.abs(closeY - openY), 1.5);

        ctx.fillRect(x - bodyWidth / 2, bodyY, bodyWidth, bodyH);
      }
    }

    // Last Live Price Tag & Horizon Line
    const lastCandle = this.candles[candleCount - 1];
    if (lastCandle) {
      const currentY = getY(lastCandle.close);
      const isBull = lastCandle.close >= lastCandle.open;
      const tagColor = isBull ? '#10b981' : '#ef4444';
      const digits = this.currentSymbol.includes('JPY') || this.currentSymbol.includes('BTC') ? 2 : 5;

      // Horizontal dashed line
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = tagColor;
      ctx.lineWidth = 1;
      ctx.moveTo(0, currentY);
      ctx.lineTo(chartWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right axis price badge
      ctx.fillStyle = tagColor;
      ctx.shadowColor = isBull ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillRect(chartWidth, currentY - 11, paddingRight, 22);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(lastCandle.close.toFixed(digits), chartWidth + 8, currentY + 4);
    }

    // Interactive Crosshair & Information HUD
    if (this.mousePos.isHover && this.mousePos.x <= chartWidth && this.mousePos.y <= chartHeight) {
      const mx = this.mousePos.x;
      const my = this.mousePos.y;

      // Dashed Crosshair Lines
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;

      ctx.moveTo(mx, 0);
      ctx.lineTo(mx, chartHeight);
      ctx.moveTo(0, my);
      ctx.lineTo(chartWidth, my);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hovered Data HUD
      const index = Math.min(Math.floor(mx / candleWidth), candleCount - 1);
      const hc = this.candles[index];

      if (hc) {
        const isUp = hc.close >= hc.open;
        const digits = this.currentSymbol.includes('JPY') || this.currentSymbol.includes('BTC') ? 2 : 5;

        // Top Left Overlay Badge
        ctx.fillStyle = 'rgba(8, 15, 28, 0.88)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.lineWidth = 1;
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(14, 14, 380, 26, 6);
        } else {
          ctx.rect(14, 14, 380, 26);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#8899b0';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        
        const openStr = `O: ${hc.open.toFixed(digits)}`;
        const highStr = `H: ${hc.high.toFixed(digits)}`;
        const lowStr  = `L: ${hc.low.toFixed(digits)}`;
        const closeStr= `C: ${hc.close.toFixed(digits)}`;

        ctx.fillText(openStr, 24, 31);
        ctx.fillText(highStr, 114, 31);
        ctx.fillText(lowStr, 204, 31);

        ctx.fillStyle = isUp ? '#34d399' : '#f87171';
        ctx.fillText(closeStr, 294, 31);
      }
    }
  }
}
