import { LitElement, html, css } from 'lit';
import { getRoutine } from './routines.js';
import './routine-side.js';

export class GettingReadyApp extends LitElement {
    static styles = css`
        :host {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }

        #split-screen {
            display: flex;
            width: 100%;
            flex: 1;
            min-height: 0;
        }

        #toolbar {
            width: 100%;
            height: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            box-sizing: border-box;
        }

        #toolbar button {
            font-size: 1em;
            padding: 5px 10px;
        }
    `;

    constructor() {
        super();
        const phases = getRoutine();
        this._leftPhases = phases.map(p => ({
            emojis: p.leftEmojis, labels: p.leftLabels, timeLimit: p.timeLimit,
        }));
        this._rightPhases = phases.map(p => ({
            emojis: p.rightEmojis, labels: p.rightLabels, timeLimit: p.timeLimit,
        }));
        localStorage.removeItem('emojiStopwatchState');
    }

    render() {
        return html`
            <div id="split-screen">
                <routine-side
                    name="Joshua"
                    .phases=${this._leftPhases}
                    storageKey="gettingReady.left"
                ></routine-side>
                <routine-side
                    name="Lottie"
                    .phases=${this._rightPhases}
                    storageKey="gettingReady.right"
                ></routine-side>
            </div>
            <div id="toolbar">
                <button @click=${() => window.location.reload()}>Refresh</button>
            </div>
        `;
    }
}

customElements.define('getting-ready-app', GettingReadyApp);
