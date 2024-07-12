import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import '../src/fx-connection.js'; // Import your FxConnection class

chai.use(sinonChai); // Use sinon-chai to integrate Sinon with Chai
const { assert } = chai;

describe('FxConnection', () => {
  let sandbox;
  let fxConnection;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    fxConnection = await fixture(html`<fx-connection></fx-connection>`);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should set attributes correctly', () => {
    fxConnection.url = 'ws://example.com';
    fxConnection.heartbeat = 1000;
    fxConnection.messageformat = 'text';

    expect(fxConnection.url).to.equal('ws://example.com');
    expect(fxConnection.heartbeat).to.equal(1000);
    expect(fxConnection.messageformat).to.equal('text');
  });

  it('should call _connect when url attribute is set', () => {
    const connectSpy = sandbox.spy(fxConnection, '_connect');
    fxConnection.url = 'ws://example.com';
    expect(connectSpy.calledOnce).to.be.true;
  });

  it('should call _setupHeartbeat when heartbeat attribute is set', () => {
    const setupHeartbeatSpy = sandbox.spy(fxConnection, '_setupHeartbeat');
    fxConnection.heartbeat = 1000;
    expect(setupHeartbeatSpy.calledOnce).to.be.true;
  });

  it('should call _connect and _disconnect when url attribute is changed', () => {
    const connectSpy = sandbox.spy(fxConnection, '_connect');
    const disconnectSpy = sandbox.spy(fxConnection, '_disconnect');
    fxConnection.url = 'ws://example.com';
    fxConnection.url = 'ws://new-example.com';
    expect(connectSpy.calledTwice).to.be.true;
    expect(disconnectSpy.calledOnce).to.be.true;
  });

  it('should send data when send method is called', () => {
    const sendSpy = sandbox.spy(fxConnection, '_sendMessage');
    fxConnection.send('Hello, World!');
    expect(sendSpy.calledOnce).to.be.true;
    expect(sendSpy.calledWith('Hello, World!')).to.be.true;
  });

  // Add more tests for other methods and behaviors of your FxConnection class
});
