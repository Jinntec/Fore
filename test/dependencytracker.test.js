import { expect } from '@open-wc/testing';
import '../index.js';
// import {DependencyTracker} from "../src/DependencyTracker.js";

'../index.js';

class MockControl {
    constructor(name) {
        this.name = name;
        this.refreshed = false;
    }
    refresh() {
        this.refreshed = true;
    }
}

describe('DependencyTracker XPath Handling', () => {
    let tracker;

    beforeEach(() => {
        tracker = new DependencyTracker();
    });

    it('Tracks direct XPath dependencies', () => {
        const control = new MockControl('control1');
        tracker.register('/root/foo/bar', control);
        tracker.notifyChange('/root/foo/bar');
        tracker.processUpdates();
        expect(control.refreshed).to.be.true;
    });

    it('Handles ancestor axis dependencies', () => {
        const ancestorControl = new MockControl('ancestorControl');
        const childControl = new MockControl('childControl');

        tracker.register('/root/foo', ancestorControl);
        tracker.register('/root/foo/bar', childControl);
        tracker.registerDependency('/root/foo/bar', '/root/foo');

        tracker.notifyChange('/root/foo/bar');
        tracker.processUpdates();

        expect(ancestorControl.refreshed).to.be.true;
        expect(childControl.refreshed).to.be.true;
    });

    it('Handles descendant axis dependencies', () => {
        const parentControl = new MockControl('parentControl');
        const descendantControl = new MockControl('descendantControl');

        tracker.register('/root/foo', parentControl);
        tracker.register('/root/foo/bar/baz', descendantControl);
        tracker.registerDependency('/root/foo', '/root/foo/bar/baz');

        tracker.notifyChange('/root/foo');
        tracker.processUpdates();

        expect(descendantControl.refreshed).to.be.true;
    });

    it('Handles preceding axis dependencies', () => {
        const precedingControl = new MockControl('precedingControl');
        const targetControl = new MockControl('targetControl');

        tracker.register('/root/item[1]', precedingControl);
        tracker.register('/root/item[2]', targetControl);
        tracker.registerDependency('/root/item[2]', '/root/item[1]');

        tracker.notifyChange('/root/item[2]');
        tracker.processUpdates();

        expect(precedingControl.refreshed).to.be.true;
    });

    it('Handles following axis dependencies', () => {
        const followingControl = new MockControl('followingControl');
        const targetControl = new MockControl('targetControl');

        tracker.register('/root/item[2]', followingControl);
        tracker.register('/root/item[1]', targetControl);
        tracker.registerDependency('/root/item[1]', '/root/item[2]');

        tracker.notifyChange('/root/item[1]');
        tracker.processUpdates();

        expect(followingControl.refreshed).to.be.true;
    });

    it('Handles wildcard * dependencies', () => {
        const wildcardControl = new MockControl('wildcardControl');

        tracker.register('/root/*', wildcardControl);
        tracker.notifyChange('/root/foo');
        tracker.processUpdates();

        expect(wildcardControl.refreshed).to.be.true;
    });

    it('Handles parent .. dependencies', () => {
        const parentControl = new MockControl('parentControl');

        tracker.register('/root/foo', parentControl);
        tracker.registerDependency('/root/foo/..', '/root/foo');

        tracker.notifyChange('/root/foo/..');
        tracker.processUpdates();

        expect(parentControl.refreshed).to.be.true;
    });

    it('Handles instance() function', () => {
        const instanceControl = new MockControl('instanceControl');

        tracker.register('instance()/data/item', instanceControl);
        tracker.notifyChange('instance()/data/item');
        tracker.processUpdates();

        expect(instanceControl.refreshed).to.be.true;
    });

    it('Handles index() function', () => {
        const indexControl = new MockControl('indexControl');

        tracker.register('/root/foo/bar[2]', indexControl);
        tracker.updateRepeatIndex('/root/foo/bar[2]', 3);
        tracker.processUpdates();

        expect(indexControl.refreshed).to.be.true;
    });
});
