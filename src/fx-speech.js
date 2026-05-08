// fx-speech.js — Fore-compatible voice input component with focus alignment, restart, repeat/back commands, and visual listening indicator
class FxSpeech extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mode = this.getAttribute('mode') || 'guided';
    this.currentIndex = 0;
    this.controls = [];
    this.recognition = null;
    this.lastInputCaptured = false;
    this.awaitingInput = false;
    this.waitingToAdvance = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        button { margin: 0.5em; padding: 0.5em 1em; font-size: 1em; }
        #status { display: inline-block; margin-left: 1em; font-weight: bold; color: green; visibility: hidden; }
        #status.listening { visibility: visible; animation: pulse 1s infinite; }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      </style>
      <button id="start">🎤 Start Speech Input</button>
      <button id="retry" style="display:none;">🔁 Continue</button>
      <span id="status">🎧 Listening…</span>
    `;

    this.controls = Array.from(document.querySelectorAll('fx-control'));
    this.initSpeech();

    this.shadowRoot.getElementById('start').addEventListener('click', () => {
      this.startInteraction();
    });

    this.shadowRoot.getElementById('retry').addEventListener('click', () => {
      this.startGuided();
    });

    document.addEventListener('focusin', e => {
      const targetControl = e.target.closest('fx-control');
      if (targetControl) {
        const index = this.controls.indexOf(targetControl);
        if (index !== -1) {
          this.currentIndex = index;
        }
      }
    });
  }

  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API not supported in this browser.');
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;

    this.recognition.onresult = event => {
      this.lastSpoken = null;
      const spoken = event.results[0][0].transcript.trim();
      console.log('Recognized:', spoken);
      this.lastInputCaptured = true;
      this.awaitingInput = false;
      this.toggleListening(false);

      if (this.mode === 'guided') {
        this.lastSpoken = spoken.toLowerCase();
        this.applyGuidedInput(this.lastSpoken);
      } else {
        this.handleCommandInput(spoken.toLowerCase());
      }
    };

    this.recognition.onerror = e => {
      console.warn('Speech error:', e.error);
      this.awaitingInput = false;
      this.toggleListening(false);
      if (this.mode === 'guided' && !this.waitingToAdvance) this.retryGuided();
    };

    this.recognition.onend = () => {
      this.recognitionActive = false;
      console.log('Recognition ended');
      this.toggleListening(false);
      if (this.mode === 'guided') {
        if (this.lastInputCaptured && !['next', 'back'].includes(this.lastSpoken)) {
          this.advanceToNextField();
        } else if (this.awaitingInput && !this.waitingToAdvance) {
          this.retryGuided();
        }
      }
    };

    this.recognition.onstart = () => {
      this.recognitionActive = true;
      console.log('Recognition started');
      this.toggleListening(true);
    };
  }

  toggleListening(state) {
    const status = this.shadowRoot.getElementById('status');
    if (state) {
      status.classList.add('listening');
    } else {
      status.classList.remove('listening');
    }
  }

  speak(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = async () => {
      await this.waitForSpeechSynthesisToEnd();
      if (callback) callback();
    };
    speechSynthesis.speak(utterance);
  }

  async waitForSpeechSynthesisToEnd() {
    while (speechSynthesis.speaking) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  getLabelText(control) {
    return (
      control.getAttribute('aria-label') ||
      control.querySelector('label')?.textContent?.trim() ||
      'unknown field'
    );
  }

  getInputElement(control) {
    return control.querySelector('input, textarea, select');
  }

  startInteraction() {
    this.shadowRoot.getElementById('retry').style.display = 'none';
    if (this.mode === 'guided') {
      this.startGuided();
    } else {
      this.recognition.start();
    }
  }

  startGuided() {
    this.shadowRoot.getElementById('retry').style.display = 'none';
    if (this.currentIndex >= this.controls.length) {
      this.speak('All fields completed.', () => {
        this.currentIndex = 0;
        this.shadowRoot.getElementById('start').textContent = '🔁 Restart Speech Input';
        this.shadowRoot.getElementById('retry').style.display = 'inline-block';
      });
      return;
    }
    this.lastInputCaptured = false;
    this.awaitingInput = true;
    this.waitingToAdvance = false;
    const control = this.controls[this.currentIndex];
    const label = this.getLabelText(control);
    const input = this.getInputElement(control);
    input?.focus();

    console.log('Prompting for field:', label);
    this.speak(`Please say value for ${label}`, () => {
      console.log('Starting recognition for:', label);
      if (!this.recognitionActive) this.recognition.start();
    });
  }

  retryGuided() {
    this.shadowRoot.getElementById('retry').style.display = 'inline-block';
    this.awaitingInput = false;
    this.speak('Please try again or tap continue.');
  }

  applyGuidedInput(spoken) {
    if (spoken === 'clear') {
      const control = this.controls[this.currentIndex];
      const input = this.getInputElement(control);
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        this.speak('Cleared');
      }
      return;
    }
    if (spoken === 'next') {
      this.advanceToNextField();
      return;
    }
    if (spoken === 'repeat') {
      this.startGuided();
      return;
    }
    if (spoken === 'back') {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.startGuided();
      return;
    }
    const control = this.controls[this.currentIndex];
    const input = this.getInputElement(control);
    if (input) {
      input.value = spoken;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  advanceToNextField() {
    this.waitingToAdvance = true;
    setTimeout(() => {
      this.currentIndex++;
      this.startGuided();
    }, 1000);
  }

  handleCommandInput(spoken) {
    if (spoken.startsWith('skip to')) {
      const label = spoken.replace('skip to', '').trim();
      const target = this.controls.find(ctrl => this.getLabelText(ctrl).toLowerCase() === label);
      if (target) {
        this.currentIndex = this.controls.indexOf(target);
        this.getInputElement(target)?.focus();
        this.speak(`Skipping to ${label}`);
      } else {
        this.speak(`Label "${label}" not found.`);
      }
      return;
    }

    if (spoken === 'next') {
      this.currentIndex++;
      return;
    }
    if (spoken === 'repeat') {
      this.startGuided();
      return;
    }
    if (spoken === 'back') {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.startGuided();
      return;
    }

    const [label, ...rest] = spoken.split(' ');
    const value = rest.join(' ');
    const target = this.controls.find(ctrl => this.getLabelText(ctrl).toLowerCase() === label);
    if (target) {
      const input = this.getInputElement(target);
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    } else {
      this.speak(`Label "${label}" not found.`);
    }
  }
}

customElements.define('fx-speech', FxSpeech);
