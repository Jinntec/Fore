class FxSpeech extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mode = 'guided'; // 'guided' or 'command'
    this.isRecording = false;
    this.currentField = null;
    this.reservedWords = {
      finish: 'finish',
      skip: 'skip to',
      next: 'next'
    };
    
    // Initialize speech recognition
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    // Initialize speech synthesis
    this.synthesis = window.speechSynthesis;
    
    this.setupRecognition();
    this.render();
  }

  setupRecognition() {
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
        .toLowerCase();

      if (this.mode === 'guided') {
        this.handleGuidedMode(transcript);
      } else {
        this.handleCommandMode(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.speak('Error in speech recognition');
    };
  }

  handleGuidedMode(transcript) {
    if (!this.currentField) {
      this.speak('Please select a field to input data');
      return;
    }

    // Check for reserved words
    if (transcript.includes(this.reservedWords.finish)) {
      this.moveToNextField();
      return;
    }

    // Update the current field's value
    this.currentField.value = transcript;
  }

  handleCommandMode(transcript) {
    // Handle skip command
    if (transcript.startsWith(this.reservedWords.skip)) {
      const targetLabel = transcript.replace(this.reservedWords.skip, '').trim();
      this.skipToField(targetLabel);
      return;
    }

    // Handle field-value pairs
    const parts = transcript.split(' ');
    if (parts.length >= 2) {
      const label = parts[0];
      const value = parts.slice(1).join(' ');
      this.setFieldValue(label, value);
    }
  }

  skipToField(label) {
    const field = this.findFieldByLabel(label);
    if (field) {
      this.currentField = field;
      this.speak(`Navigated to ${label}`);
    } else {
      this.speak(`Field ${label} not found`);
    }
  }

  setFieldValue(label, value) {
    const field = this.findFieldByLabel(label);
    if (field) {
      field.value = value;
      this.speak(`Set ${label} to ${value}`);
    } else {
      this.speak(`Field ${label} not found`);
    }
  }

  findFieldByLabel(label) {
    const form = this.querySelector('form');
    if (!form) return null;

    // Try to find by label text
    const labelElement = Array.from(form.querySelectorAll('label'))
      .find(l => l.textContent.toLowerCase().includes(label.toLowerCase()));
    
    if (labelElement && labelElement.htmlFor) {
      return form.querySelector(`#${labelElement.htmlFor}`);
    }

    // Try to find by placeholder
    const inputByPlaceholder = Array.from(form.querySelectorAll('input, textarea'))
      .find(input => input.placeholder.toLowerCase().includes(label.toLowerCase()));
    
    if (inputByPlaceholder) return inputByPlaceholder;

    // Try to find by aria-label
    const inputByAriaLabel = Array.from(form.querySelectorAll('input, textarea'))
      .find(input => input.getAttribute('aria-label')?.toLowerCase().includes(label.toLowerCase()));
    
    return inputByAriaLabel || null;
  }

  moveToNextField() {
    const form = this.querySelector('form');
    if (!form) return;

    const inputs = Array.from(form.querySelectorAll('input, textarea'));
    const currentIndex = inputs.indexOf(this.currentField);
    
    if (currentIndex < inputs.length - 1) {
      this.currentField = inputs[currentIndex + 1];
      this.speakFieldLabel(this.currentField);
    } else {
      this.speak('You have reached the end of the form');
    }
  }

  speakFieldLabel(field) {
    const label = this.getFieldLabel(field);
    if (label) {
      this.speak(`Please enter value for ${label}`);
    }
  }

  getFieldLabel(field) {
    // Try to get label from associated label element
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent;
    }

    // Try to get from placeholder
    if (field.placeholder) return field.placeholder;

    // Try to get from aria-label
    if (field.getAttribute('aria-label')) return field.getAttribute('aria-label');

    return 'unnamed field';
  }

  speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    this.synthesis.speak(utterance);
  }

  startRecording() {
    if (!this.isRecording) {
      this.recognition.start();
      this.isRecording = true;
      this.speak(this.mode === 'guided' ? 'Guided mode activated' : 'Command mode activated');
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      this.speak('Recording stopped');
    }
  }

  toggleMode() {
    this.mode = this.mode === 'guided' ? 'command' : 'guided';
    this.speak(`Switched to ${this.mode} mode`);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
        .status {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }
      </style>
      <div class="controls">
        <button id="toggleMode">Switch to ${this.mode === 'guided' ? 'Command' : 'Guided'} Mode</button>
        <button id="startRecording">Start Recording</button>
        <button id="stopRecording">Stop Recording</button>
      </div>
      <div class="status">
        Mode: ${this.mode}
        Status: ${this.isRecording ? 'Recording' : 'Stopped'}
      </div>
      <slot></slot>
    `;

    // Add event listeners
    this.shadowRoot.getElementById('toggleMode').addEventListener('click', () => this.toggleMode());
    this.shadowRoot.getElementById('startRecording').addEventListener('click', () => this.startRecording());
    this.shadowRoot.getElementById('stopRecording').addEventListener('click', () => this.stopRecording());
  }
}

customElements.define('fx-speech', FxSpeech); 