import { LitElement, html, css } from 'lit';
import { getRoutine } from './routines.js';
import './routine-half.js';

export class GettingReadyApp extends LitElement {
    static properties = {
        _running: { state: true },
        _paused: { state: true },
        _formattedTime: { state: true },
        _leftIndex: { state: true },
        _rightIndex: { state: true },
        _leftFinishedInTime: { state: true },
        _rightFinishedInTime: { state: true },
        _currentPhase: { state: true },
    };

    static styles = css`
        :host {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            position: relative;
        }

        .start-button {
            font-size: 15vw;
            padding: 2vw 8vw;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        #split-screen {
            display: flex;
            width: 100%;
            height: calc(100% - 50px);
        }

        .phase-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(255, 255, 255, 0.7);
            z-index: 10;
        }

        #toolbar {
            width: 100%;
            height: 50px;
            display: flex;
            align-items: center;
            padding: 0 15px;
            box-sizing: border-box;
            position: relative;
        }

        #toolbar p {
            text-align: left;
            margin: 0;
            position: absolute;
            left: 15px;
        }

        #toolbar .button-group {
            display: flex;
            justify-content: center;
            gap: 10px;
            width: 100%;
        }

        #toolbar button {
            font-size: 1em;
            padding: 5px 10px;
        }
    `;

    constructor() {
        super();
        this._running = false;
        this._paused = false;
        this._formattedTime = '';
        this._leftIndex = 0;
        this._rightIndex = 0;
        this._leftFinishedInTime = null;
        this._rightFinishedInTime = null;
        this._leftFinishFormatted = null;
        this._rightFinishFormatted = null;
        this._phases = [];
        this._currentPhase = 0;
        this._phaseStartTime = null;
        this._pauseTimestamp = null;
        this._timerInterval = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadState();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this._timerInterval);
    }

    get _phase() {
        return this._phases[this._currentPhase];
    }

    _isAllComplete() {
        if (!this._phase) return false;
        return this._leftIndex >= this._phase.leftEmojis.length &&
               this._rightIndex >= this._phase.rightEmojis.length &&
               this._currentPhase === this._phases.length - 1;
    }

    _remainingSeconds() {
        const elapsed = Math.floor((Date.now() - this._phaseStartTime) / 1000);
        return this._phase.timeLimit - elapsed;
    }

    _remainingSecondsAt(timestamp) {
        const elapsed = Math.floor((timestamp - this._phaseStartTime) / 1000);
        return this._phase.timeLimit - elapsed;
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
        const state = {
            phases: this._phases,
            currentPhase: this._currentPhase,
            phaseStartTime: this._phaseStartTime,
            pauseTimestamp: this._pauseTimestamp,
            paused: this._paused,
            leftIndex: this._leftIndex,
            rightIndex: this._rightIndex,
            leftFinishedInTime: this._leftFinishedInTime,
            rightFinishedInTime: this._rightFinishedInTime,
            leftFinishFormatted: this._leftFinishFormatted,
            rightFinishFormatted: this._rightFinishFormatted,
            savedAt: Date.now(),
        };
        localStorage.setItem('emojiStopwatchState', JSON.stringify(state));
    }

    _loadState() {
        const state = JSON.parse(localStorage.getItem('emojiStopwatchState'));
        if (!state || Date.now() - state.savedAt >= 3600000) {
            localStorage.removeItem('emojiStopwatchState');
            return;
        }

        this._phases = state.phases;
        this._currentPhase = state.currentPhase;
        this._phaseStartTime = state.phaseStartTime;
        this._pauseTimestamp = state.pauseTimestamp || null;
        this._paused = state.paused || false;
        this._leftIndex = state.leftIndex;
        this._rightIndex = state.rightIndex;
        this._leftFinishedInTime = state.leftFinishedInTime ?? null;
        this._rightFinishedInTime = state.rightFinishedInTime ?? null;
        this._leftFinishFormatted = state.leftFinishFormatted || null;
        this._rightFinishFormatted = state.rightFinishFormatted || null;

        if (this._pauseTimestamp) {
            const remaining = this._remainingSecondsAt(this._pauseTimestamp);
            this._formattedTime = this._formatCountdown(remaining);
        } else {
            this._startTimer();
        }
        this._running = true;
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

    _init() {
        this._phases = getRoutine();
        this._currentPhase = 0;
        this._leftIndex = 0;
        this._rightIndex = 0;
        this._leftFinishedInTime = null;
        this._rightFinishedInTime = null;
        this._leftFinishFormatted = null;
        this._rightFinishFormatted = null;
        this._pauseTimestamp = null;
        this._paused = false;

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
        this._phaseStartTime = now.getTime();

        this._saveState();
        this._startTimer();
        this._running = true;
    }

    _startNextPhase() {
        this._currentPhase++;
        this._leftIndex = 0;
        this._rightIndex = 0;
        this._leftFinishedInTime = null;
        this._rightFinishedInTime = null;
        this._leftFinishFormatted = null;
        this._rightFinishFormatted = null;
        this._pauseTimestamp = null;
        this._paused = false;
        this._phaseStartTime = Date.now();
        this._saveState();
        this._startTimer();
    }

    _stop() {
        clearInterval(this._timerInterval);
        this._running = false;
        this._paused = false;
        localStorage.removeItem('emojiStopwatchState');
    }

    _checkPhaseComplete() {
        const leftDone = this._leftIndex >= this._phase.leftEmojis.length;
        const rightDone = this._rightIndex >= this._phase.rightEmojis.length;
        if (leftDone && rightDone) {
            clearInterval(this._timerInterval);
            this._pauseTimestamp = Date.now();
            this._formattedTime = this._formatCountdown(this._remainingSecondsAt(this._pauseTimestamp));
            if (this._currentPhase < this._phases.length - 1) {
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

    _onLeftAdvance() {
        if (this._leftIndex < this._phase.leftEmojis.length) {
            this._leftIndex++;
            if (this._leftIndex === this._phase.leftEmojis.length) {
                const remaining = this._remainingSeconds();
                this._leftFinishedInTime = remaining > 0;
                this._leftFinishFormatted = this._formatCountdown(remaining);
            }
            this._saveState();
            this._checkPhaseComplete();
        }
    }

    _onRightAdvance() {
        if (this._rightIndex < this._phase.rightEmojis.length) {
            this._rightIndex++;
            if (this._rightIndex === this._phase.rightEmojis.length) {
                const remaining = this._remainingSeconds();
                this._rightFinishedInTime = remaining > 0;
                this._rightFinishFormatted = this._formatCountdown(remaining);
            }
            this._saveState();
            this._checkPhaseComplete();
        }
    }

    _onLeftUndo() {
        if (this._leftIndex > 0) {
            const wasDone = this._leftIndex === this._phase.leftEmojis.length;
            const bothWereDone = wasDone && this._rightIndex >= this._phase.rightEmojis.length;
            if (wasDone) {
                this._leftFinishedInTime = null;
                this._leftFinishFormatted = null;
            }
            this._leftIndex--;
            if (bothWereDone) {
                this._resumeFromPause();
            }
            this._saveState();
        }
    }

    _onRightUndo() {
        if (this._rightIndex > 0) {
            const wasDone = this._rightIndex === this._phase.rightEmojis.length;
            const bothWereDone = wasDone && this._leftIndex >= this._phase.leftEmojis.length;
            if (wasDone) {
                this._rightFinishedInTime = null;
                this._rightFinishFormatted = null;
            }
            this._rightIndex--;
            if (bothWereDone) {
                this._resumeFromPause();
            }
            this._saveState();
        }
    }

    _leftTime() {
        return this._leftFinishFormatted ?? this._formattedTime;
    }

    _rightTime() {
        return this._rightFinishFormatted ?? this._formattedTime;
    }

    render() {
        if (!this._running) {
            return html`<button class="start-button" @click=${this._init}>Start</button>`;
        }

        const phase = this._phase;

        return html`
            <div id="split-screen">
                <routine-half
                    name="Joshua"
                    .emojis=${phase.leftEmojis}
                    .labels=${phase.leftLabels}
                    .taskIndex=${this._leftIndex}
                    .finishedInTime=${this._leftFinishedInTime}
                    .formattedTime=${this._leftTime()}
                    @task-advance=${this._onLeftAdvance}
                    @task-undo=${this._onLeftUndo}
                ></routine-half>
                <routine-half
                    name="Lottie"
                    .emojis=${phase.rightEmojis}
                    .labels=${phase.rightLabels}
                    .taskIndex=${this._rightIndex}
                    .finishedInTime=${this._rightFinishedInTime}
                    .formattedTime=${this._rightTime()}
                    @task-advance=${this._onRightAdvance}
                    @task-undo=${this._onRightUndo}
                ></routine-half>
            </div>
            ${this._paused ? html`
                <div class="phase-overlay">
                    <button class="start-button" @click=${this._startNextPhase}>Start</button>
                </div>
            ` : ''}
            <div id="toolbar">
                ${this._phases.length > 1 ? html`<p>Phase ${this._currentPhase + 1} of ${this._phases.length}</p>` : ''}
                <div class="button-group">
                    <button @click=${this._stop}>Stop</button>
                    <button @click=${() => window.location.reload()}>Refresh</button>
                </div>
            </div>
        `;
    }
}

customElements.define('getting-ready-app', GettingReadyApp);
