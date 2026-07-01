{
  // Build the Claude request and send it via fetch(). Process the response and
  // fill formdata + append to transcript inline in the Promise callback.
  //
  // Using fetch() directly avoids the Fore JSON-instance serialization race:
  // fx-submission reads from Fore's internal JSONLens, not the instanceData
  // property we set, so the payload would always be stale.

  const fore = document.querySelector('fx-fore');
  const settings = document.querySelector('fx-instance#settings').instanceData;
  const transcript = document.querySelector('fx-instance#transcript').instanceData;

  // Read schema from fx-bind elements that have a label child
  const bindScope = fore.querySelector('[data-chat-schema]') || fore;
  const binds = bindScope.querySelectorAll('fx-bind[ref]');

  const properties = {};
  const fieldLines = [];
  binds.forEach(bind => {
    const ref = bind.getAttribute('ref');
    const label = bind.querySelector('label');
    if (!label) return;
    const type = bind.getAttribute('type') || 'string';
    const description = label.textContent.trim();
    properties[ref] = { type, description };
    fieldLines.push(`- ${ref} (${type}): ${description}`);
  });

  // Build messages array from XML transcript
  const messages = [...transcript.querySelectorAll('message')].map(m => ({
    role: m.getAttribute('role') || 'user',
    content: m.textContent.trim()
  }));

  const schemaName = settings.querySelector('schema')?.textContent || 'form';
  const modelName  = settings.querySelector('model')?.textContent  || 'claude-haiku-4-5';
  const apiKey     = settings.querySelector('apikey')?.textContent  || '';
  const endpoint   = settings.querySelector('endpoint')?.textContent || 'https://api.anthropic.com/v1/messages';

  const systemPrompt =
    `You are Fore Chat, a form-fill assistant for the ${schemaName} form.\n` +
    `When a user describes data, call fill_form with the values you extract.\n` +
    `Never ask for confirmation before filling — just fill and acknowledge briefly.\n` +
    `If a field is ambiguous or missing, ask one focused question.\n\n` +
    `Available fields:\n${fieldLines.join('\n')}`;

  const payload = {
    model: modelName,
    max_tokens: 2048,
    system: systemPrompt,
    tools: [{
      name: 'fill_form',
      description: 'Fill form fields with values extracted from the user message. Include only fields you are confident about.',
      input_schema: { type: 'object', properties }
    }],
    messages
  };

  const uiStatus = document.querySelector('fx-instance#ui').instanceData.querySelector('status');

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(payload)
  })
  .then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  })
  .then(response => {
    // Fill formdata from tool_use block
    const formdata = document.querySelector('fx-instance#formdata').instanceData;
    let assistantText = '';

    for (const block of (response.content || [])) {
      if (block.type === 'tool_use' && block.name === 'fill_form') {
        for (const [field, value] of Object.entries(block.input || {})) {
          const node = formdata.querySelector(field);
          if (node) node.textContent = String(value);
        }
      }
      if (block.type === 'text') assistantText = block.text;
    }

    // Direct XML mutation bypasses Fore's change tracking — force a full refresh
    fore.refresh(true);

    // Append assistant reply to transcript
    const msgs = transcript.querySelector('messages');
    if (msgs) {
      const msg = transcript.createElement('message');
      msg.setAttribute('role', 'assistant');
      msg.textContent = assistantText || '(done)';
      msgs.appendChild(msg);
    }

    if (uiStatus) uiStatus.textContent = '';
    fore.refresh(true);

    const scroll = document.getElementById('transcript-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  })
  .catch(err => {
    const msg = err?.error?.message || err?.message || 'Unknown error';
    if (uiStatus) uiStatus.textContent = 'Error: ' + msg;
    fore.refresh();
  });
}
