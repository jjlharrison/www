import { LitElement, html, css } from 'lit';
import { getRoutine, emojiImageUrl } from './routines.js';
import './routine-half.js';

export class GettingReadyApp extends LitElement {
    static properties = {
        running: { type: Boolean },
        formattedTime: { type: String },
        leftIndex: { type: Number },
        rightIndex: { type: Number },
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
        }

        #start-button {
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
        this.running = false;
        this.formattedTime = '0:00';
        this.leftIndex = 0;
        this.rightIndex = 0;
        this.startTime = null;
        this.emojis = [];
        this.labels = [];
        this._timerInterval = null;
        this._leftFinishTime = null;
        this._rightFinishTime = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadState();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this._timerInterval);
    }

    _saveState() {
        const state = {
            leftIndex: this.leftIndex,
            rightIndex: this.rightIndex,
            startTime: this.startTime,
            leftFinishTime: this._leftFinishTime,
            rightFinishTime: this._rightFinishTime,
            savedAt: Date.now(),
        };
        localStorage.setItem('emojiStopwatchState', JSON.stringify(state));
    }

    _loadState() {
        const state = JSON.parse(localStorage.getItem('emojiStopwatchState'));
        if (state) {
            const now = Date.now();
            if (now - state.savedAt < 3600000) {
                this.leftIndex = state.leftIndex;
                this.rightIndex = state.rightIndex;
                this.startTime = state.startTime;
                this._leftFinishTime = state.leftFinishTime || null;
                this._rightFinishTime = state.rightFinishTime || null;
                this._start();
            } else {
                localStorage.removeItem('emojiStopwatchState');
            }
        }
    }

    _start() {
        const { emojis, labels } = getRoutine();
        this.emojis = emojis;
        this.labels = labels;
        this._updateTimers();
        this._timerInterval = setInterval(() => this._updateTimers(), 1000);
        this.running = true;
    }

    _reset() {
        const now = new Date(Date.now());
        const startHour = now.getHours();
        const startMinute = now.getMinutes();
        this.leftIndex = 0;
        this.rightIndex = 0;
        this._leftFinishTime = null;
        this._rightFinishTime = null;
        if (now.getDay() === 0 || now.getDay() === 6) {
            // Weekend: start now
        } else if (startHour < 7 || (startHour === 7 && startMinute < 15)) {
            now.setHours(6, 45, 0, 0);
        } else if (startHour === 7 && startMinute < 30) {
            now.setHours(7, 0, 0, 0);
        }
        this.startTime = now.getTime();
        this._saveState();
    }

    _init() {
        this._reset();
        this._start();
    }

    _stop() {
        clearInterval(this._timerInterval);
        this.running = false;
        localStorage.removeItem('emojiStopwatchState');
        this._reset();
    }

    _updateTimers() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this._saveState();
    }

    _formatTime(timestamp) {
        const elapsed = Math.floor((timestamp - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    _onLeftAdvance() {
        if (this.leftIndex < this.emojis.length) {
            this.leftIndex++;
            if (this.leftIndex === this.emojis.length) {
                this._leftFinishTime = Date.now();
            }
            this._saveState();
        }
    }

    _onRightAdvance() {
        if (this.rightIndex < this.emojis.length) {
            this.rightIndex++;
            if (this.rightIndex === this.emojis.length) {
                this._rightFinishTime = Date.now();
            }
            this._saveState();
        }
    }

    _onLeftUndo() {
        if (this.leftIndex > 0) {
            if (this.leftIndex === this.emojis.length) {
                this._leftFinishTime = null;
            }
            this.leftIndex--;
            this._saveState();
        }
    }

    _onRightUndo() {
        if (this.rightIndex > 0) {
            if (this.rightIndex === this.emojis.length) {
                this._rightFinishTime = null;
            }
            this.rightIndex--;
            this._saveState();
        }
    }

    _leftTime() {
        if (this._leftFinishTime) return this._formatTime(this._leftFinishTime);
        return this.formattedTime;
    }

    _rightTime() {
        if (this._rightFinishTime) return this._formatTime(this._rightFinishTime);
        return this.formattedTime;
    }

    render() {
        if (!this.running) {
            return html`<button id="start-button" @click=${this._init}>Start</button>`;
        }

        return html`
            <div id="split-screen">
                <routine-half
                    name="Joshua"
                    .emojis=${this.emojis}
                    .labels=${this.labels}
                    .taskIndex=${this.leftIndex}
                    .startTime=${this.startTime}
                    .formattedTime=${this._leftTime()}
                    @task-advance=${this._onLeftAdvance}
                    @task-undo=${this._onLeftUndo}
                ></routine-half>
                <routine-half
                    name="Lottie"
                    .emojis=${this.emojis}
                    .labels=${this.labels}
                    .taskIndex=${this.rightIndex}
                    .startTime=${this.startTime}
                    .formattedTime=${this._rightTime()}
                    @task-advance=${this._onRightAdvance}
                    @task-undo=${this._onRightUndo}
                ></routine-half>
            </div>
            <div id="toolbar">
                <p>&lt;15m = 🐝🐝, 15m-20m = 🐝, &gt;20m = 😠</p>
                <div class="button-group">
                    <button @click=${this._stop}>Stop</button>
                    <button @click=${() => window.location.reload()}>Refresh</button>
                </div>
            </div>
        `;
    }
}

customElements.define('getting-ready-app', GettingReadyApp);
