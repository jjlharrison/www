import { LitElement, html, css } from 'lit';
import { emojiImageUrl } from './routines.js';

export class RoutineHalf extends LitElement {
    static properties = {
        name: { type: String },
        emojis: { type: Array },
        labels: { type: Array },
        taskIndex: { type: Number },
        finishedInTime: { attribute: false },
        formattedTime: { type: String },
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

        .undo-button {
            padding: 5px 10px;
            font-size: 1em;
            cursor: pointer;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }
    `;

    _emojiImg(emoji) {
        return html`<img src="${emojiImageUrl(emoji)}" alt="${emoji}">`;
    }

    _completionHtml() {
        const bee = html`<img src="${emojiImageUrl('🐝')}" alt="🐝">`;
        if (this.finishedInTime) return bee;
        return this._emojiImg('✅');
    }

    _onEmojiClick() {
        this.dispatchEvent(new CustomEvent('task-advance', { bubbles: true, composed: true }));
    }

    _onUndo() {
        this.dispatchEvent(new CustomEvent('task-undo', { bubbles: true, composed: true }));
    }

    render() {
        const done = this.taskIndex >= this.emojis.length;
        const emoji = done ? null : this.emojis[this.taskIndex];
        const label = done ? 'Done' : this.labels[this.taskIndex];
        const overtime = this.formattedTime.startsWith('-');

        return html`
            <div class="title">${this.name}</div>
            <div class="emoji" @click=${this._onEmojiClick}>
                ${done ? this._completionHtml() : this._emojiImg(emoji)}
            </div>
            <div class="label">${label}</div>
            <div class="stopwatch ${overtime ? 'overtime' : ''}">${this.formattedTime}</div>
            <button class="undo-button" @click=${this._onUndo}>Undo</button>
        `;
    }
}

customElements.define('routine-half', RoutineHalf);
