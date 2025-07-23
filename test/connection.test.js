import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';

import '../src/fx-connection.js'; // Import your FxConnection class

describe('FxConnection', () => {
  before(() => {
    chai.use(sinonChai); // Use sinon-chai to integrate Sinon with Chai
  });
  /**
   * @type {sinon.Sandbox}
   */
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
    expect(connectSpy).to.be.calledOnce;
  });
  it('should call _setupHeartbeat when heartbeat attribute is set', () => {
    const setupHeartbeatSpy = sandbox.spy(fxConnection, '_setupHeartbeat');
    fxConnection.heartbeat = 1000;
    expect(setupHeartbeatSpy).to.be.calledOnce;
  });
  it('should call _connect and _disconnect when url attribute is changed', () => {
    const connectSpy = sandbox.spy(fxConnection, '_connect');
    const disconnectSpy = sandbox.spy(fxConnection, '_disconnect');
    fxConnection.url = 'ws://example.com';
    fxConnection.url = 'ws://new-example.com';
    expect(connectSpy).to.be.calledTwice;
    expect(disconnectSpy).to.be.calledOnce;
  });
  it('should send data when send method is called', () => {
    const sendSpy = sandbox.spy(fxConnection, '_sendMessage');
    fxConnection.send('Hello, World!');
    expect(sendSpy).to.be.called;
    expect(sendSpy).to.be.calledWith('Hello, World!');
  });
  // Add more tests for other methods and behaviors of your FxConnection class
});
