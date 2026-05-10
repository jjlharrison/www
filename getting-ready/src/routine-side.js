import { LitElement, html, css } from 'lit';
import { emojiImageUrl } from './routines.js';

export class RoutineSide extends LitElement {
    static properties = {
        name: { type: String },
        phases: { type: Array },
        storageKey: { type: String },
        _running: { state: true },
        _paused: { state: true },
        _currentPhase: { state: true },
        _taskIndex: { state: true },
        _formattedTime: { state: true },
        _finishedInTime: { state: true },
        _finishFormatted: { state: true },
        _beeCount: { state: true },
        _beeDialogOpen: { state: true },
        _beeAwarded: { state: true },
        _beeHistory: { state: true },
        _beeAdminVisible: { state: true },
        _pinEntryOpen: { state: true },
        _pinError: { state: true },
    };

    static styles = css`
        :host {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            border: 2px solid #ccc;
            box-sizing: border-box;
            position: relative;
        }

        .title {
            font-size: 5vw;
            font-weight: bold;
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .emoji {
            font-size: 20vw;
            cursor: pointer;
            flex: 2;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .emoji img {
            max-width: 50%;
            max-height: 100%;
            object-fit: contain;
            cursor: pointer;
        }

        .label {
            font-size: 2vw;
            text-align: center;
            min-height: 2vw;
        }

        .stopwatch {
            font-size: 3vw;
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .stopwatch.overtime {
            color: red;
        }

        .undo-button,
        .stop-button {
            padding: 5px 10px;
            font-size: 1em;
            cursor: pointer;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
            position: absolute;
            bottom: 10px;
        }

        .undo-button {
            right: 10px;
        }

        .stop-button {
            left: 10px;
        }

        .start-button {
            font-size: 10vw;
            padding: 2vw 6vw;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .phase-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(255, 255, 255, 0.7);
            z-index: 10;
        }

        .bee-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            font-size: 1.5em;
            background: white;
            border: 1px solid #ccc;
            border-radius: 999px;
            cursor: pointer;
            z-index: 11;
        }

        .bee-badge img {
            width: 1.4em;
            height: 1.4em;
        }

        .bee-dialog {
            position: absolute;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.4);
            z-index: 20;
        }

        .bee-dialog-card {
            background: white;
            border-radius: 12px;
            padding: 20px 24px;
            min-width: 60%;
            max-width: 80%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .bee-dialog-count {
            font-size: 4vw;
            display: flex;
            align-items: center;
            gap: 10px;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            cursor: default;
        }

        .bee-dialog-count img {
            width: 4vw;
            height: 4vw;
        }

        .bee-dialog-buttons {
            display: flex;
            gap: 12px;
        }

        .bee-dialog-buttons button {
            font-size: 1.2em;
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #ccc;
            background: #f0f0f0;
            cursor: pointer;
        }

        .bee-dialog-buttons button.primary {
            background: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }

        .bee-dialog-buttons button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .bee-history {
            width: 100%;
            max-height: 40vh;
            overflow-y: auto;
            border-top: 1px solid #eee;
            padding-top: 10px;
            font-size: 1em;
        }

        .bee-history-empty {
            margin: 8px 0;
            color: #888;
            text-align: center;
        }

        .bee-history-day {
            margin-bottom: 8px;
        }

        .bee-history-day-label {
            font-weight: bold;
            margin-bottom: 4px;
        }

        .bee-history-entry {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 2px 0 2px 8px;
        }

        .bee-history-entry img {
            width: 1.2em;
            height: 1.2em;
        }

        .bee-history-sign {
            font-weight: bold;
            min-width: 1ch;
            text-align: center;
        }

        .bee-history-entry.earned .bee-history-sign {
            color: #2e7d32;
        }

        .bee-history-entry.spent .bee-history-sign {
            color: #c62828;
        }

        .bee-history-entry.spent img {
            opacity: 0.6;
        }

        .bee-history-entry.added .bee-history-sign {
            color: #1565c0;
        }

        .bee-history-entry.removed .bee-history-sign {
            color: #ef6c00;
        }

        .bee-history-entry.removed img {
            opacity: 0.6;
        }

        .bee-history-tag {
            font-size: 0.75em;
            color: #888;
            background: #f0f0f0;
            border-radius: 999px;
            padding: 1px 6px;
            margin-left: 4px;
        }

        .bee-admin {
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .bee-admin button {
            font-size: 1.4em;
            min-width: 3em;
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px dashed #999;
            background: #fafafa;
            cursor: pointer;
        }

        .bee-admin button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .bee-cog {
            position: absolute;
            top: 8px;
            right: 8px;
            background: transparent;
            border: none;
            font-size: 1.4em;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
        }

        .bee-dialog-card {
            position: relative;
        }

        .pin-form {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 100%;
        }

        .pin-form label {
            font-size: 1em;
            color: #555;
        }

        .pin-input {
            font-size: 1.6em;
            padding: 6px 10px;
            text-align: center;
            letter-spacing: 0.4em;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 7em;
        }

        .pin-error {
            color: #c62828;
            font-size: 0.95em;
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.phases = [];
        this.storageKey = '';
        this._running = false;
        this._paused = false;
        this._currentPhase = 0;
        this._taskIndex = 0;
        this._formattedTime = '';
        this._finishedInTime = null;
        this._finishFormatted = null;
        this._phaseStartTime = null;
        this._pauseTimestamp = null;
        this._timerInterval = null;
        this._beeCount = 0;
        this._beeDialogOpen = false;
        this._beeAwarded = false;
        this._beeHistory = [];
        this._beeAdminVisible = false;
        this._pinEntryOpen = false;
        this._pinError = false;
    }

    static ADMIN_PIN = '6789';

    static DAILY_BEE_LIMIT = 3;

    get _beeStorageKey() {
        return this.storageKey ? `${this.storageKey}.bees` : '';
    }

    get _beeEarnedTodayStorageKey() {
        return this.storageKey ? `${this.storageKey}.beesEarnedToday` : '';
    }

    get _beeHistoryStorageKey() {
        return this.storageKey ? `${this.storageKey}.beeHistory` : '';
    }

    _loadBeeHistory() {
        if (!this._beeHistoryStorageKey) return;
        const raw = localStorage.getItem(this._beeHistoryStorageKey);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this._beeHistory = parsed.map(e => {
                    if (!e) return null;
                    if (
                        (e.type === 'earned' || e.type === 'spent' || e.type === 'added' || e.type === 'removed')
                        && Number.isFinite(e.at)
                    ) {
                        return e;
                    }
                    if (Number.isFinite(e.earnedAt)) {
                        return { type: 'earned', at: e.earnedAt };
                    }
                    return null;
                }).filter(Boolean);
            }
        } catch (e) { /* ignore */ }
    }

    _saveBeeHistory() {
        if (!this._beeHistoryStorageKey) return;
        localStorage.setItem(this._beeHistoryStorageKey, JSON.stringify(this._beeHistory));
    }

    _loadBeeCount() {
        if (!this._beeStorageKey) return;
        const raw = localStorage.getItem(this._beeStorageKey);
        if (raw == null) return;
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 0) {
            this._beeCount = n;
        }
    }

    _saveBeeCount() {
        if (!this._beeStorageKey) return;
        localStorage.setItem(this._beeStorageKey, String(this._beeCount));
    }

    _todayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    _readEarnedToday() {
        const today = this._todayKey();
        if (!this._beeEarnedTodayStorageKey) return { date: today, count: 0 };
        const raw = localStorage.getItem(this._beeEarnedTodayStorageKey);
        if (!raw) return { date: today, count: 0 };
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.date === 'string' && Number.isFinite(parsed.count)) {
                if (parsed.date !== today) return { date: today, count: 0 };
                return parsed;
            }
        } catch (e) { /* fall through */ }
        return { date: today, count: 0 };
    }

    _writeEarnedToday(record) {
        if (!this._beeEarnedTodayStorageKey) return;
        localStorage.setItem(this._beeEarnedTodayStorageKey, JSON.stringify(record));
    }

    /// Try to award a bee. Returns true if awarded, false if daily limit reached.
    _tryAwardBee() {
        const earned = this._readEarnedToday();
        if (earned.count >= RoutineSide.DAILY_BEE_LIMIT) return false;
        earned.count++;
        this._writeEarnedToday(earned);
        this._beeCount++;
        this._saveBeeCount();
        this._beeHistory = [...this._beeHistory, { type: 'earned', at: Date.now() }];
        this._saveBeeHistory();
        return true;
    }

    _refundBee() {
        const earned = this._readEarnedToday();
        if (earned.count > 0) {
            earned.count--;
            this._writeEarnedToday(earned);
        }
        if (this._beeCount > 0) {
            this._beeCount--;
            this._saveBeeCount();
        }
        let lastEarnedIdx = -1;
        for (let i = this._beeHistory.length - 1; i >= 0; i--) {
            if (this._beeHistory[i].type === 'earned') { lastEarnedIdx = i; break; }
        }
        if (lastEarnedIdx >= 0) {
            const next = [...this._beeHistory];
            next.splice(lastEarnedIdx, 1);
            this._beeHistory = next;
            this._saveBeeHistory();
        }
    }

    _spendBee() {
        if (this._beeCount > 0) {
            this._beeCount--;
            this._saveBeeCount();
            this._beeHistory = [...this._beeHistory, { type: 'spent', at: Date.now() }];
            this._saveBeeHistory();
        }
    }

    _openBeeDialog() {
        this._beeDialogOpen = true;
        this._beeAdminVisible = false;
        this._pinEntryOpen = false;
        this._pinError = false;
    }

    _closeBeeDialog() {
        this._beeDialogOpen = false;
        this._beeAdminVisible = false;
        this._pinEntryOpen = false;
        this._pinError = false;
    }

    _onSpendBee() {
        this._spendBee();
    }

    _openPinEntry() {
        this._pinEntryOpen = true;
        this._pinError = false;
    }

    _cancelPinEntry() {
        this._pinEntryOpen = false;
        this._pinError = false;
    }

    _submitPin(e) {
        e.preventDefault();
        const input = this.renderRoot.querySelector('.pin-input');
        if (input && input.value === RoutineSide.ADMIN_PIN) {
            this._beeAdminVisible = true;
            this._pinEntryOpen = false;
            this._pinError = false;
        } else {
            this._pinError = true;
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }

    updated(changed) {
        if (changed.has('_pinEntryOpen') && this._pinEntryOpen) {
            const input = this.renderRoot.querySelector('.pin-input');
            if (input) input.focus();
        }
    }

    _adminAdd() {
        this._beeCount++;
        this._saveBeeCount();
        this._beeHistory = [...this._beeHistory, { type: 'added', at: Date.now() }];
        this._saveBeeHistory();
    }

    _adminSubtract() {
        if (this._beeCount > 0) {
            this._beeCount--;
            this._saveBeeCount();
            this._beeHistory = [...this._beeHistory, { type: 'removed', at: Date.now() }];
            this._saveBeeHistory();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadBeeCount();
        this._loadBeeHistory();
        this._loadState();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this._timerInterval);
    }

    get _phase() {
        return this.phases[this._currentPhase];
    }

    _remainingSecondsAt(timestamp) {
        const elapsed = Math.floor((timestamp - this._phaseStartTime) / 1000);
        return this._phase.timeLimit - elapsed;
    }

    _remainingSeconds() {
        return this._remainingSecondsAt(Date.now());
    }

    _formatCountdown(remaining) {
        if (remaining >= 0) {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        const over = Math.abs(remaining);
        const minutes = Math.floor(over / 60);
        const seconds = over % 60;
        return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    _saveState() {
        if (!this.storageKey) return;
        const state = {
            phases: this.phases,
            running: this._running,
            paused: this._paused,
            currentPhase: this._currentPhase,
            taskIndex: this._taskIndex,
            phaseStartTime: this._phaseStartTime,
            pauseTimestamp: this._pauseTimestamp,
            finishedInTime: this._finishedInTime,
            finishFormatted: this._finishFormatted,
            beeAwarded: this._beeAwarded,
            savedAt: Date.now(),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    _loadState() {
        if (!this.storageKey) return;
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return;
        let state;
        try { state = JSON.parse(raw); } catch (e) { return; }
        if (!state || Date.now() - state.savedAt >= 3600000) {
            localStorage.removeItem(this.storageKey);
            return;
        }
        this.phases = state.phases;
        this._running = state.running || false;
        this._paused = state.paused || false;
        this._currentPhase = state.currentPhase || 0;
        this._taskIndex = state.taskIndex || 0;
        this._phaseStartTime = state.phaseStartTime;
        this._pauseTimestamp = state.pauseTimestamp || null;
        this._finishedInTime = state.finishedInTime != null ? state.finishedInTime : null;
        this._finishFormatted = state.finishFormatted || null;
        this._beeAwarded = state.beeAwarded === true;

        if (!this._running) return;
        if (this._pauseTimestamp) {
            this._formattedTime = this._formatCountdown(this._remainingSecondsAt(this._pauseTimestamp));
        } else {
            this._startTimer();
        }
    }

    _startTimer() {
        clearInterval(this._timerInterval);
        this._updateTimer();
        this._timerInterval = setInterval(() => this._updateTimer(), 1000);
    }

    _updateTimer() {
        this._formattedTime = this._formatCountdown(this._remainingSeconds());
        this._saveState();
    }

    _initialPhaseStartTime() {
        const now = new Date();
        if (now.getHours() < 12 && now.getDay() !== 0 && now.getDay() !== 6) {
            const hour = now.getHours();
            const minute = now.getMinutes();
            if (hour < 7 || (hour === 7 && minute < 15)) {
                now.setHours(6, 45, 0, 0);
            } else if (hour === 7 && minute < 30) {
                now.setHours(7, 0, 0, 0);
            }
        }
        return now.getTime();
    }

    _onStart() {
        this._currentPhase = 0;
        this._taskIndex = 0;
        this._finishedInTime = null;
        this._finishFormatted = null;
        this._beeAwarded = false;
        this._pauseTimestamp = null;
        this._paused = false;
        this._phaseStartTime = this._initialPhaseStartTime();
        this._running = true;
        this._saveState();
        this._startTimer();
    }

    _onStartNextPhase() {
        this._currentPhase++;
        this._taskIndex = 0;
        this._finishedInTime = null;
        this._finishFormatted = null;
        this._beeAwarded = false;
        this._pauseTimestamp = null;
        this._paused = false;
        this._phaseStartTime = Date.now();
        this._saveState();
        this._startTimer();
    }

    _checkPhaseComplete() {
        if (this._taskIndex >= this._phase.emojis.length) {
            clearInterval(this._timerInterval);
            this._pauseTimestamp = Date.now();
            this._formattedTime = this._formatCountdown(this._remainingSecondsAt(this._pauseTimestamp));
            if (this._currentPhase < this.phases.length - 1) {
                this._paused = true;
            }
            this._saveState();
        }
    }

    _resumeFromPause() {
        if (this._pauseTimestamp) {
            this._phaseStartTime += Date.now() - this._pauseTimestamp;
            this._pauseTimestamp = null;
        }
        this._paused = false;
        this._startTimer();
    }

    _onEmojiClick() {
        if (!this._running || this._paused) return;
        if (this._taskIndex < this._phase.emojis.length) {
            this._taskIndex++;
            if (this._taskIndex === this._phase.emojis.length) {
                const remaining = this._remainingSeconds();
                this._finishedInTime = remaining > 0;
                this._finishFormatted = this._formatCountdown(remaining);
                if (this._finishedInTime) {
                    this._beeAwarded = this._tryAwardBee();
                }
            }
            this._saveState();
            this._checkPhaseComplete();
        }
    }

    _onUndo() {
        if (!this._running || this._taskIndex === 0) return;
        const wasDone = this._taskIndex === this._phase.emojis.length;
        const wasAwarded = wasDone && this._beeAwarded;
        if (wasDone) {
            this._finishedInTime = null;
            this._finishFormatted = null;
            this._beeAwarded = false;
        }
        this._taskIndex--;
        if (wasAwarded) {
            this._refundBee();
        }
        if (wasDone) {
            this._resumeFromPause();
        }
        this._saveState();
    }

    reset() {
        clearInterval(this._timerInterval);
        this._running = false;
        this._paused = false;
        this._currentPhase = 0;
        this._taskIndex = 0;
        this._formattedTime = '';
        this._finishedInTime = null;
        this._finishFormatted = null;
        this._beeAwarded = false;
        this._phaseStartTime = null;
        this._pauseTimestamp = null;
        if (this.storageKey) localStorage.removeItem(this.storageKey);
    }

    _emojiImg(emoji) {
        return html`<img src="${emojiImageUrl(emoji)}" alt="${emoji}">`;
    }

    _completionHtml() {
        const bee = html`<img src="${emojiImageUrl('🐝')}" alt="🐝">`;
        if (this._finishedInTime) return bee;
        return this._emojiImg('✅');
    }

    _displayTime() {
        return this._finishFormatted != null ? this._finishFormatted : this._formattedTime;
    }

    _formatTime(ts) {
        return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    _dayLabel(d) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }

    _beeHistoryByDay() {
        const groups = new Map();
        for (const entry of this._beeHistory) {
            const d = new Date(entry.at);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!groups.has(key)) {
                groups.set(key, { label: this._dayLabel(d), date: d, entries: [] });
            }
            groups.get(key).entries.push(entry);
        }
        return [...groups.values()].sort((a, b) => b.date - a.date);
    }

    _beeBadge() {
        return html`
            <button class="bee-badge" @click=${this._openBeeDialog} title="Bees">
                <img src="${emojiImageUrl('🐝')}" alt="🐝">
                <span>${this._beeCount}</span>
            </button>
        `;
    }

    _beeDialog() {
        if (!this._beeDialogOpen) return '';
        const days = this._beeHistoryByDay();
        return html`
            <div class="bee-dialog" @click=${this._closeBeeDialog}>
                <div class="bee-dialog-card" @click=${(e) => e.stopPropagation()}>
                    <button
                        class="bee-cog"
                        title="Settings"
                        aria-label="Settings"
                        @click=${this._openPinEntry}
                    >⚙️</button>
                    <div class="bee-dialog-count">
                        <img src="${emojiImageUrl('🐝')}" alt="🐝">
                        <span>${this._beeCount}</span>
                    </div>
                    ${this._pinEntryOpen ? html`
                        <form class="pin-form" @submit=${this._submitPin}>
                            <label>Enter PIN</label>
                            <input
                                class="pin-input"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                autocomplete="off"
                                maxlength="6"
                            >
                            ${this._pinError ? html`<div class="pin-error">Wrong PIN</div>` : ''}
                            <div class="bee-dialog-buttons">
                                <button type="submit" class="primary">OK</button>
                                <button type="button" @click=${this._cancelPinEntry}>Cancel</button>
                            </div>
                        </form>
                    ` : html`
                        <div class="bee-dialog-buttons">
                            <button
                                class="primary"
                                ?disabled=${this._beeCount === 0}
                                @click=${this._onSpendBee}
                            >Spend a bee</button>
                            <button @click=${this._closeBeeDialog}>Close</button>
                        </div>
                    `}
                    ${this._beeAdminVisible && !this._pinEntryOpen ? html`
                        <div class="bee-admin">
                            <button @click=${this._adminSubtract} ?disabled=${this._beeCount === 0}>−</button>
                            <button @click=${this._adminAdd}>+</button>
                        </div>
                    ` : ''}
                    <div class="bee-history">
                        ${days.length === 0
                            ? html`<p class="bee-history-empty">No bees earned yet</p>`
                            : days.map(group => html`
                                <div class="bee-history-day">
                                    <div class="bee-history-day-label">${group.label}</div>
                                    ${group.entries.map(entry => {
                                        const positive = entry.type === 'earned' || entry.type === 'added';
                                        const manual = entry.type === 'added' || entry.type === 'removed';
                                        return html`
                                            <div class="bee-history-entry ${entry.type}">
                                                <span class="bee-history-sign">${positive ? '+' : '−'}</span>
                                                <img src="${emojiImageUrl('🐝')}" alt="🐝">
                                                <span>${this._formatTime(entry.at)}</span>
                                                ${manual ? html`<span class="bee-history-tag">manual</span>` : ''}
                                            </div>
                                        `;
                                    })}
                                </div>
                            `)}
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        if (!this._running) {
            return html`
                ${this._beeBadge()}
                <div class="title">${this.name}</div>
                <div class="emoji">
                    <button class="start-button" @click=${this._onStart}>Start</button>
                </div>
                <div class="label"></div>
                <div class="stopwatch"></div>
                ${this._beeDialog()}
            `;
        }

        const phase = this._phase;
        const done = this._taskIndex >= phase.emojis.length;
        const emoji = done ? null : phase.emojis[this._taskIndex];
        const label = done ? 'Done' : phase.labels[this._taskIndex];
        const time = this._displayTime();
        const overtime = time.startsWith('-');

        return html`
            ${this._beeBadge()}
            <div class="title">${this.name}</div>
            <div class="emoji" @click=${this._onEmojiClick}>
                ${done ? this._completionHtml() : this._emojiImg(emoji)}
            </div>
            <div class="label">${label}</div>
            <div class="stopwatch ${overtime ? 'overtime' : ''}">${time}</div>
            <button class="stop-button" @click=${this.reset}>Stop</button>
            <button class="undo-button" @click=${this._onUndo}>Undo</button>
            ${this._paused ? html`
                <div class="phase-overlay">
                    <button class="start-button" @click=${this._onStartNextPhase}>Start</button>
                </div>
            ` : ''}
            ${this._beeDialog()}
        `;
    }
}

customElements.define('routine-side', RoutineSide);
