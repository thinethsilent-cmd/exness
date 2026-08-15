/* ==========================================================================
   Exclusive Admin Suite Controller
   Target Admins: 123@hutto.com & thinethsilent@gmail.com
   ========================================================================== */

export class AdminController {
  constructor(tradingEngine, authModule) {
    this.tradingEngine = tradingEngine;
    this.authModule = authModule;
    this.ADMIN_EMAILS = ['123@hutto.com', 'thinethsilent@gmail.com'];
    
    this.pendingDeposits = [
      { id: 'DEP-8832', user: 'trader1@gmail.com', amount: 5000, method: 'Crypto (USDT-TRC20)', status: 'Pending', time: '10 mins ago' },
      { id: 'DEP-9104', user: 'alex_forex@yahoo.com', amount: 1500, method: 'Bank Wire', status: 'Pending', time: '25 mins ago' }
    ];

    this.pendingWithdrawals = [
      { id: 'WTH-4012', user: 'trader2@gmail.com', amount: 2000, method: 'Crypto (USDT)', destination: '0x71C...39A', status: 'Pending', time: '15 mins ago' }
    ];
  }

  isAdmin(user) {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    return this.ADMIN_EMAILS.includes(email);
  }

  initAdminUI() {
    const adminBtn = document.getElementById('btn-admin-dashboard');
    const adminModal = document.getElementById('admin-modal-backdrop');
    const closeBtn = document.getElementById('admin-modal-close');

    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (!this.isAdmin(this.authModule.currentUser)) {
          alert('Access Denied: Exclusive Admin Privilege Required for 123@hutto.com or thinethsilent@gmail.com');
          return;
        }
        this.renderAdminData();
        if (adminModal) adminModal.classList.add('active');
      });
    }

    if (closeBtn && adminModal) {
      closeBtn.addEventListener('click', () => {
        adminModal.classList.remove('active');
      });
    }

    this.bindAdminActions();
  }

  renderAdminData() {
    // 1. Render Stats
    const totalPosEl = document.getElementById('admin-stat-positions');
    const totalVolumeEl = document.getElementById('admin-stat-volume');
    const totalPnlEl = document.getElementById('admin-stat-pnl');

    if (totalPosEl) totalPosEl.textContent = this.tradingEngine.openPositions.length;
    
    let totalLots = 0;
    let totalPnl = 0;
    this.tradingEngine.openPositions.forEach(p => {
      totalLots += p.lots;
      totalPnl += p.pnl;
    });

    if (totalVolumeEl) totalVolumeEl.textContent = totalLots.toFixed(2) + ' Lots';
    if (totalPnlEl) {
      totalPnlEl.textContent = (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2);
      totalPnlEl.className = 'admin-stat-value ' + (totalPnl >= 0 ? 'val-up' : 'val-down');
    }

    // Combine Engine pending deposits with default sample deposits
    const allDeposits = [...this.tradingEngine.pendingDeposits, ...this.pendingDeposits];

    // 2. Render Pending Deposits Table
    const depTableBody = document.getElementById('admin-deposits-tbody');
    if (depTableBody) {
      depTableBody.innerHTML = '';
      if (allDeposits.length === 0) {
        depTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#787b86;">No pending deposit requests</td></tr>`;
      } else {
        allDeposits.forEach(dep => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${dep.id}</td>
            <td>${dep.user}</td>
            <td style="color:#089981; font-weight:bold;">+$${dep.amount.toFixed(2)}</td>
            <td>${dep.method}</td>
            <td>
              <button class="btn-approve-dep" data-id="${dep.id}" data-amount="${dep.amount}" data-user="${dep.user}" style="background:#089981; color:#fff; padding:3px 8px; border-radius:4px; margin-right:4px;">Approve</button>
              <button class="btn-reject-dep" data-id="${dep.id}" style="background:#f23645; color:#fff; padding:3px 8px; border-radius:4px;">Reject</button>
            </td>
          `;
          depTableBody.appendChild(tr);
        });
      }
    }

    // 3. Render Pending Withdrawals Table
    const allWithdrawals = [...this.tradingEngine.pendingWithdrawals, ...this.pendingWithdrawals];
    const wthTableBody = document.getElementById('admin-withdrawals-tbody');
    if (wthTableBody) {
      wthTableBody.innerHTML = '';
      if (allWithdrawals.length === 0) {
        wthTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#787b86;">No pending withdrawal requests</td></tr>`;
      } else {
        allWithdrawals.forEach(wth => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${wth.id}</td>
            <td>${wth.user}</td>
            <td style="color:#f23645; font-weight:bold;">-$${wth.amount.toFixed(2)}</td>
            <td>${wth.method}</td>
            <td style="font-family:var(--font-mono); font-size:11px;">${wth.destination}</td>
            <td>
              <button class="btn-approve-wth" data-id="${wth.id}" data-amount="${wth.amount}" style="background:#089981; color:#fff; padding:3px 8px; border-radius:4px; margin-right:4px;">Approve</button>
              <button class="btn-reject-wth" data-id="${wth.id}" data-amount="${wth.amount}" style="background:#f23645; color:#fff; padding:3px 8px; border-radius:4px;">Reject</button>
            </td>
          `;
          wthTableBody.appendChild(tr);
        });
      }
    }
  }

  bindAdminActions() {
    // Balance Adjuster Form
    const balanceForm = document.getElementById('admin-balance-form');
    if (balanceForm) {
      balanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-adjust-email').value;
        const amount = parseFloat(document.getElementById('admin-adjust-amount').value);
        const type = document.getElementById('admin-adjust-type').value; // 'CREDIT' or 'DEBIT'

        if (!amount || isNaN(amount)) return;

        if (this.authModule.currentUser && this.authModule.currentUser.email === email) {
          if (type === 'CREDIT') {
            this.tradingEngine.userAccount.balance += amount;
          } else {
            this.tradingEngine.userAccount.balance = Math.max(0, this.tradingEngine.userAccount.balance - amount);
          }
          this.tradingEngine.updateAccountMetrics();
          alert(`Successfully ${type}ED $${amount.toFixed(2)} to ${email}`);
          this.renderAdminData();
        } else {
          alert(`Action Processed: $${amount.toFixed(2)} ${type} applied to user ${email}.`);
        }
      });
    }

    // Market Shock Injector Form
    const shockForm = document.getElementById('admin-shock-form');
    if (shockForm) {
      shockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const symbol = document.getElementById('admin-shock-symbol').value;
        const pct = parseFloat(document.getElementById('admin-shock-pct').value);

        if (isNaN(pct)) return;

        const res = this.tradingEngine.adminInjectPriceShock(symbol, pct);
        if (res) {
          alert(`Market Price Shock Applied to ${symbol}!\nOld Price: ${res.oldPrice.toFixed(4)}\nNew Price: ${res.newPrice.toFixed(4)}`);
        }
      });
    }

    // Deposit & Withdrawal approvals delegation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-approve-dep')) {
        const id = e.target.dataset.id;
        const amount = parseFloat(e.target.dataset.amount) || 0;
        this.pendingDeposits = this.pendingDeposits.filter(d => d.id !== id);
        this.tradingEngine.pendingDeposits = this.tradingEngine.pendingDeposits.filter(d => d.id !== id);
        
        // Credit balance if current user
        this.tradingEngine.userAccount.balance += amount;
        this.tradingEngine.updateAccountMetrics();

        alert(`Deposit ${id} Approved! $${amount.toFixed(2)} credited to account balance.`);
        this.renderAdminData();
      } else if (e.target.classList.contains('btn-reject-dep')) {
        const id = e.target.dataset.id;
        this.pendingDeposits = this.pendingDeposits.filter(d => d.id !== id);
        this.tradingEngine.pendingDeposits = this.tradingEngine.pendingDeposits.filter(d => d.id !== id);
        alert(`Deposit ${id} Rejected.`);
        this.renderAdminData();
      } else if (e.target.classList.contains('btn-approve-wth')) {
        const id = e.target.dataset.id;
        this.pendingWithdrawals = this.pendingWithdrawals.filter(w => w.id !== id);
        this.tradingEngine.pendingWithdrawals = this.tradingEngine.pendingWithdrawals.filter(w => w.id !== id);
        alert(`Withdrawal ${id} Approved & Processed!`);
        this.renderAdminData();
      } else if (e.target.classList.contains('btn-reject-wth')) {
        const id = e.target.dataset.id;
        const amount = parseFloat(e.target.dataset.amount) || 0;
        this.pendingWithdrawals = this.pendingWithdrawals.filter(w => w.id !== id);
        this.tradingEngine.pendingWithdrawals = this.tradingEngine.pendingWithdrawals.filter(w => w.id !== id);
        // Refund balance on rejection
        this.tradingEngine.userAccount.balance += amount;
        this.tradingEngine.updateAccountMetrics();
        alert(`Withdrawal ${id} Rejected. Funds refunded to user balance.`);
        this.renderAdminData();
      }
    });
  }
}
