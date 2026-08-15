/* ==========================================================================
   Financial Trading & Market Simulation Engine (with Firestore Persistence)
   ========================================================================== */

import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp 
} from './firebase-config.js';

export class TradingEngine {
  constructor() {
    this.assets = {
      'EUR/USD': { basePrice: 1.0850, price: 1.0850, spread: 0.00015, digits: 5, contractSize: 100000, category: 'forex', change24h: +0.24 },
      'GBP/USD': { basePrice: 1.2720, price: 1.2720, spread: 0.00020, digits: 5, contractSize: 100000, category: 'forex', change24h: -0.12 },
      'USD/JPY': { basePrice: 154.50, price: 154.50, spread: 0.02000, digits: 2, contractSize: 100000, category: 'forex', change24h: +0.45 },
      'BTC/USD': { basePrice: 94500.00, price: 94500.00, spread: 15.00, digits: 2, contractSize: 1, category: 'crypto', change24h: +3.82 },
      'ETH/USD': { basePrice: 3450.00, price: 3450.00, spread: 1.20, digits: 2, contractSize: 1, category: 'crypto', change24h: -1.05 },
      'XAU/USD': { basePrice: 2650.50, price: 2650.50, spread: 0.35, digits: 2, contractSize: 100, category: 'commodity', change24h: +0.88 },
      'AAPL': { basePrice: 228.40, price: 228.40, spread: 0.08, digits: 2, contractSize: 100, category: 'stock', change24h: +1.15 },
      'NVDA': { basePrice: 135.20, price: 135.20, spread: 0.05, digits: 2, contractSize: 100, category: 'stock', change24h: +4.20 },
    };

    this.activeSymbol = 'EUR/USD';
    this.candles = {};
    this.openPositions = [];
    this.closedTrades = [];
    this.pendingDeposits = [];
    this.pendingWithdrawals = [];
    
    this.userAccount = {
      uid: null,
      email: 'Guest',
      balance: 0.00,
      equity: 0.00,
      usedMargin: 0.00,
      freeMargin: 0.00,
      marginLevel: 0.0,
      accountType: 'Real Account'
    };

    this.listeners = {
      priceTick: [],
      positionUpdate: [],
      accountUpdate: [],
      historyUpdate: [],
      depositUpdate: [],
      withdrawalUpdate: []
    };

    this.initHistoricalCandles();
    this.startMarketSimulation();
    this.initLiveWebSocket();
  }

  setUser(user) {
    if (user) {
      this.userAccount.uid = user.uid;
      this.userAccount.email = user.email;
      
      const isAdmin = user.email.toLowerCase() === '123@hutto.com' || user.email.toLowerCase() === 'thinethsilent@gmail.com';

      // Load / listen to user account from Firestore
      const userRef = doc(db, 'users', user.uid);
      onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.balance !== undefined) {
            this.userAccount.balance = data.balance;
            this.updateAccountMetrics();
          }
        } else {
          // Initialize user doc in Firestore (New user opening balance is $0.00 for all users)
          const defaultBalance = 0.00;
          setDoc(userRef, {
            email: user.email,
            balance: defaultBalance,
            createdAt: serverTimestamp(),
            role: isAdmin ? 'admin' : 'trader'
          });
          this.userAccount.balance = defaultBalance;
          this.updateAccountMetrics();
        }
      }, (err) => {
        console.log('Firestore snapshot fallback to local mode:', err);
      });
    } else {
      this.userAccount.uid = null;
      this.userAccount.email = 'Guest';
      this.userAccount.balance = 0.00;
      this.updateAccountMetrics();
    }
  }

  // Pre-generate historical candles for all assets
  initHistoricalCandles() {
    for (const [symbol, info] of Object.entries(this.assets)) {
      this.candles[symbol] = [];
      let currentPrice = info.basePrice;
      const count = 80;

      for (let i = 0; i < count; i++) {
        const volatility = currentPrice * 0.0015;
        const change = (Math.random() - 0.49) * volatility;
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        this.candles[symbol].push({ open, high, low, close, time: Date.now() - (count - i) * 60000 });
        currentPrice = close;
      }

      info.price = currentPrice;
    }
  }

  startMarketSimulation() {
    let tickCount = 0;
    setInterval(() => {
      tickCount++;
      this.simulateTick(tickCount);
    }, 900);
  }

  simulateTick(tickCount) {
    for (const [symbol, info] of Object.entries(this.assets)) {
      const volatility = info.price * 0.0008;
      const delta = (Math.random() - 0.495) * volatility;
      info.price = Math.max(info.price + delta, 0.0001);

      const candleList = this.candles[symbol];
      if (candleList && candleList.length > 0) {
        const last = candleList[candleList.length - 1];
        last.close = info.price;
        last.high = Math.max(last.high, info.price);
        last.low = Math.min(last.low, info.price);

        // Every 30 ticks (~27s), push new candle bar
        if (tickCount % 30 === 0) {
          candleList.push({
            open: info.price,
            high: info.price,
            low: info.price,
            close: info.price,
            time: Date.now()
          });
          if (candleList.length > 120) candleList.shift();
        }
      }
    }

    this.updatePositionsPnL();
    this.notify('priceTick', { symbol: this.activeSymbol, assets: this.assets });
  }

  adminInjectPriceShock(symbol, pctChange) {
    if (this.assets[symbol]) {
      const oldPrice = this.assets[symbol].price;
      this.assets[symbol].price *= (1 + pctChange / 100);
      const newPrice = this.assets[symbol].price;
      
      const candleList = this.candles[symbol];
      if (candleList && candleList.length > 0) {
        const last = candleList[candleList.length - 1];
        last.close = newPrice;
        last.high = Math.max(last.high, newPrice);
        last.low = Math.min(last.low, newPrice);
      }
      this.updatePositionsPnL();
      this.notify('priceTick', { symbol: this.activeSymbol, assets: this.assets });
      return { oldPrice, newPrice };
    }
    return null;
  }

  getBidAsk(symbol) {
    const info = this.assets[symbol] || this.assets['EUR/USD'];
    const bid = info.price;
    const ask = info.price + info.spread;
    return { bid, ask, digits: info.digits };
  }

  calculateRequiredMargin(symbol, lots, leverage) {
    const info = this.assets[symbol];
    if (!info) return 0;
    const price = info.price;
    const positionValue = lots * info.contractSize * price;
    return positionValue / leverage;
  }

  openOrder({ symbol, type, lots, leverage, stopLoss, takeProfit }) {
    const info = this.assets[symbol];
    if (!info) return { success: false, message: 'Invalid symbol' };

    const requiredMargin = this.calculateRequiredMargin(symbol, lots, leverage);
    if (requiredMargin > this.userAccount.freeMargin) {
      return { success: false, message: 'Insufficient Free Margin' };
    }

    const { bid, ask } = this.getBidAsk(symbol);
    const openPrice = type === 'BUY' ? ask : bid;

    const position = {
      id: 'POS-' + Math.floor(100000 + Math.random() * 900000),
      symbol,
      type,
      lots,
      leverage,
      openPrice,
      currentPrice: openPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      requiredMargin,
      pnl: 0.00,
      openTime: new Date().toLocaleTimeString()
    };

    this.openPositions.push(position);
    this.updateAccountMetrics();
    this.notify('positionUpdate', this.openPositions);
    return { success: true, position };
  }

  closeOrder(positionId) {
    const index = this.openPositions.findIndex(p => p.id === positionId);
    if (index === -1) return { success: false, message: 'Position not found' };

    const pos = this.openPositions[index];
    this.openPositions.splice(index, 1);

    this.userAccount.balance += pos.pnl;
    pos.closeTime = new Date().toLocaleTimeString();
    pos.closePrice = pos.currentPrice;
    
    this.closedTrades.unshift(pos);

    // Sync balance update to Firestore if logged in
    if (this.userAccount.uid) {
      try {
        const userRef = doc(db, 'users', this.userAccount.uid);
        updateDoc(userRef, { balance: this.userAccount.balance });
      } catch (err) {
        console.log('Firestore balance update fallback:', err);
      }
    }

    this.updateAccountMetrics();
    this.notify('positionUpdate', this.openPositions);
    this.notify('historyUpdate', this.closedTrades);
    this.notify('accountUpdate', this.userAccount);

    return { success: true, closedPosition: pos };
  }

  submitDepositRequest(amount, method) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1 || amt > 10000) {
      return { success: false, message: 'Deposit amount must be between $1 and $10,000' };
    }

    const request = {
      id: 'DEP-' + Math.floor(1000 + Math.random() * 9000),
      user: this.userAccount.email,
      uid: this.userAccount.uid,
      amount: amt,
      method,
      status: 'Pending',
      time: new Date().toLocaleTimeString()
    };

    this.pendingDeposits.unshift(request);
    this.notify('depositUpdate', this.pendingDeposits);
    return { success: true, request };
  }

  submitWithdrawalRequest(amount, method, destination) {
    const amt = parseFloat(amount);
    if (amt > this.userAccount.freeMargin) {
      return { success: false, message: 'Withdrawal amount exceeds Free Margin' };
    }

    // Deduct balance temporarily pending admin approval
    this.userAccount.balance -= amt;
    this.updateAccountMetrics();

    const request = {
      id: 'WTH-' + Math.floor(1000 + Math.random() * 9000),
      user: this.userAccount.email,
      uid: this.userAccount.uid,
      amount: amt,
      method,
      destination,
      status: 'Pending',
      time: new Date().toLocaleTimeString()
    };

    this.pendingWithdrawals.unshift(request);
    this.notify('withdrawalUpdate', this.pendingWithdrawals);
    return { success: true, request };
  }

  updatePositionsPnL() {
    let totalFloatingPnL = 0;
    let totalMargin = 0;

    for (let i = this.openPositions.length - 1; i >= 0; i--) {
      const pos = this.openPositions[i];
      const info = this.assets[pos.symbol];
      if (!info) continue;

      const { bid, ask } = this.getBidAsk(pos.symbol);
      pos.currentPrice = pos.type === 'BUY' ? bid : ask;

      if (pos.type === 'BUY') {
        pos.pnl = (pos.currentPrice - pos.openPrice) * pos.lots * info.contractSize;
      } else {
        pos.pnl = (pos.openPrice - pos.currentPrice) * pos.lots * info.contractSize;
      }

      totalFloatingPnL += pos.pnl;
      totalMargin += pos.requiredMargin;

      if (pos.takeProfit) {
        if ((pos.type === 'BUY' && pos.currentPrice >= pos.takeProfit) ||
            (pos.type === 'SELL' && pos.currentPrice <= pos.takeProfit)) {
          this.closeOrder(pos.id);
          continue;
        }
      }

      if (pos.stopLoss) {
        if ((pos.type === 'BUY' && pos.currentPrice <= pos.stopLoss) ||
            (pos.type === 'SELL' && pos.currentPrice >= pos.stopLoss)) {
          this.closeOrder(pos.id);
          continue;
        }
      }
    }

    this.userAccount.equity = this.userAccount.balance + totalFloatingPnL;
    this.userAccount.usedMargin = totalMargin;
    this.userAccount.freeMargin = this.userAccount.equity - totalMargin;
    this.userAccount.marginLevel = totalMargin > 0 ? (this.userAccount.equity / totalMargin) * 100 : 0;

    this.notify('accountUpdate', this.userAccount);
  }

  updateAccountMetrics() {
    this.updatePositionsPnL();
  }

  // Live Crypto WebSocket Stream (Binance public feed)
  initLiveWebSocket() {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        let targetSymbol = null;
        if (data.s === 'BTCUSDT') targetSymbol = 'BTC/USD';
        else if (data.s === 'ETHUSDT') targetSymbol = 'ETH/USD';

        if (targetSymbol && this.assets[targetSymbol]) {
          const livePrice = parseFloat(data.c);
          if (!isNaN(livePrice) && livePrice > 0) {
            this.assets[targetSymbol].price = livePrice;
            this.assets[targetSymbol].change24h = parseFloat(data.P);
          }
        }
      };
      ws.onerror = (e) => console.log('Live WS fallback to simulation tick mode');
    } catch (e) {
      console.log('WS init fallback');
    }
  }

  // Production CSV Data Export
  exportTradesToCSV() {
    if (this.closedTrades.length === 0) return false;
    let csv = 'Ticket,Symbol,Type,Lots,Open Price,Close Price,Open Time,Close Time,Realized PnL\n';
    this.closedTrades.forEach(t => {
      csv += `${t.id},${t.symbol},${t.type},${t.lots},${t.openPrice},${t.closePrice || t.currentPrice},"${t.openTime}","${t.closeTime || ''}",${t.pnl}\n`;
    });
    this.downloadCSVFile(csv, `NexusTrader_TradeHistory_${Date.now()}.csv`);
    return true;
  }

  exportTransactionsToCSV() {
    const allLogs = [...this.pendingDeposits, ...this.pendingWithdrawals];
    if (allLogs.length === 0) return false;
    let csv = 'Request ID,Type,Amount,Method,Destination,Time,Status\n';
    allLogs.forEach(l => {
      csv += `${l.id},${l.destination ? 'WITHDRAWAL' : 'DEPOSIT'},${l.amount},"${l.method}","${l.destination || ''}","${l.time}",${l.status}\n`;
    });
    this.downloadCSVFile(csv, `NexusTrader_Transactions_${Date.now()}.csv`);
    return true;
  }

  downloadCSVFile(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadZuckerbergDemoPortfolio() {
    this.userAccount.balance = 2500000.00;
    this.userAccount.accountType = 'Institutional Meta VC VIP';

    this.openPositions = [
      {
        id: 'POS-889102',
        symbol: 'BTC/USD',
        type: 'BUY',
        lots: 10.0,
        leverage: 100,
        openPrice: 94100.00,
        currentPrice: 94500.00,
        stopLoss: 91000.00,
        takeProfit: 105000.00,
        requiredMargin: 9450.00,
        pnl: 4000.00,
        openTime: '10:14:22 AM'
      },
      {
        id: 'POS-774190',
        symbol: 'NVDA',
        type: 'BUY',
        lots: 15.0,
        leverage: 50,
        openPrice: 132.20,
        currentPrice: 135.20,
        stopLoss: 125.00,
        takeProfit: 150.00,
        requiredMargin: 3966.00,
        pnl: 4500.00,
        openTime: '11:02:15 AM'
      },
      {
        id: 'POS-663211',
        symbol: 'EUR/USD',
        type: 'BUY',
        lots: 20.0,
        leverage: 100,
        openPrice: 1.0820,
        currentPrice: 1.0850,
        stopLoss: 1.0750,
        takeProfit: 1.0950,
        requiredMargin: 21640.00,
        pnl: 6000.00,
        openTime: '01:45:09 PM'
      }
    ];

    this.closedTrades = [
      {
        id: 'HIST-9901',
        symbol: 'BTC/USD',
        type: 'BUY',
        lots: 25.0,
        openPrice: 89200.00,
        closePrice: 94200.00,
        openTime: 'Yesterday, 09:15',
        closeTime: 'Today, 08:30',
        pnl: 125000.00
      },
      {
        id: 'HIST-9898',
        symbol: 'XAU/USD',
        type: 'BUY',
        lots: 10.0,
        openPrice: 2620.00,
        closePrice: 2650.50,
        openTime: 'Yesterday, 14:20',
        closeTime: 'Today, 09:10',
        pnl: 30500.00
      },
      {
        id: 'HIST-9875',
        symbol: 'AAPL',
        type: 'BUY',
        lots: 50.0,
        openPrice: 220.00,
        closePrice: 228.40,
        openTime: '3 days ago',
        closeTime: 'Yesterday, 16:00',
        pnl: 42000.00
      }
    ];

    this.pendingDeposits = [
      {
        id: 'DEP-9001',
        user: 'mark.zuckerberg@meta.com',
        uid: 'zuck-meta-001',
        amount: 2500000.00,
        method: 'Meta Horizon Capital Wire Transfer',
        status: 'Approved',
        time: 'Today, 09:00 AM'
      }
    ];

    this.updateAccountMetrics();
    this.notify('accountUpdate', this.userAccount);
    this.notify('positionUpdate', this.openPositions);
    this.notify('historyUpdate', this.closedTrades);
    this.notify('depositUpdate', this.pendingDeposits);

    return true;
  }

  subscribe(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}


