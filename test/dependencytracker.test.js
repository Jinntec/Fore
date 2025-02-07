import { expect } from '@open-wc/testing';
import '../index.js';
import {DependencyTracker} from "../src/DependencyTracker.js";

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

describe.only('DependencyTracker XPath Handling', () => {
    let tracker;

    beforeEach(() => {
        tracker = DependencyTracker.getInstance();
    });

    it('Tracks direct XPath dependencies', () => {
        const control = new MockControl('control1');
        tracker.register('$default/root/foo/bar', control);
        tracker.notifyChange('$default/root/foo/bar');
        tracker.processUpdates();
        expect(control.refreshed).to.be.true;
    });

/*
    it.only('Automatically registers dependencies from predicates', () => {
        const control = new MockControl('predicateControl');
        tracker.register("instance('countries')//country[@continent = instance('default')/continent]", control);
        tracker.notifyChange("instance('default')/continent");
        tracker.processUpdates();
        expect(control.refreshed).to.be.true;
    });
*/

    it('Handles index() function changes correctly', () => {
        const control = new MockControl('indexControl');
        tracker.register('$default/root/foo/bar[2]', control);
        tracker.updateRepeatIndex('$default/root/foo/bar[2]', 3);
        tracker.processUpdates();
        expect(control.refreshed).to.be.true;
    });

    it('Handles ancestor axis dependencies', () => {
        const ancestorControl = new MockControl('ancestorControl');
        const childControl = new MockControl('childControl');

        tracker.register('$default/root/foo', ancestorControl);
        tracker.register('$default/root/foo/bar', childControl);
        tracker.registerDependency('$default/root/foo/bar', '$default/root/foo');

        tracker.notifyChange('$default/root/foo/bar');
        tracker.processUpdates();

        expect(ancestorControl.refreshed).to.be.true;
        expect(childControl.refreshed).to.be.true;
    });

    it('Handles descendant axis dependencies', () => {
        const parentControl = new MockControl('parentControl');
        const descendantControl = new MockControl('descendantControl');

        tracker.register('$default/root/foo', parentControl);
        tracker.register('$default/root/foo/bar/baz', descendantControl);
        tracker.registerDependency('$default/root/foo', '$default/root/foo/bar/baz');

        tracker.notifyChange('$default/root/foo');
        tracker.processUpdates();

        expect(descendantControl.refreshed).to.be.true;
    });

    it('Handles preceding axis dependencies', () => {
        const precedingControl = new MockControl('precedingControl');
        const targetControl = new MockControl('targetControl');

        tracker.register('$default/root/item[1]', precedingControl);
        tracker.register('$default/root/item[2]', targetControl);
        tracker.registerDependency('$default/root/item[2]', '$default/root/item[1]');

        tracker.notifyChange('$default/root/item[2]');
        tracker.processUpdates();

        expect(precedingControl.refreshed).to.be.true;
    });

    it('Handles following axis dependencies', () => {
        const followingControl = new MockControl('followingControl');
        const targetControl = new MockControl('targetControl');

        tracker.register('$default/root/item[2]', followingControl);
        tracker.register('$default/root/item[1]', targetControl);
        tracker.registerDependency( '$default/root/item[2]','$default/root/item[1]');

        tracker.notifyChange('$default/root/item[1]');
        tracker.processUpdates();

        expect(followingControl.refreshed).to.be.true;
    });

    it('Handles wildcard * dependencies', () => {
        const wildcardControl = new MockControl('wildcardControl');

        tracker.register('$default/root/*', wildcardControl);
        tracker.notifyChange('$default/root/foo');
        tracker.processUpdates();

        expect(wildcardControl.refreshed).to.be.true;
    });

    it('Handles parent .. dependencies', () => {
        const parentControl = new MockControl('parentControl');
        const childControl = new MockControl('childControl');

        tracker.register('$default/root/foo', parentControl);
        tracker.register('$default/root/foo/..', childControl);
        tracker.registerDependency('$default/root/foo/..', '$default/root/foo');
        // tracker.registerDependency( '$default/root/foo','$default/root/foo/..');

        tracker.notifyChange('$default/root/foo/..');
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


    it('Handles instance() function with // correctly', () => {
        const instanceControl = new MockControl('instanceControl');

        tracker.register("instance('countries')//country[@continent = instance('default')/continent]", instanceControl);
        tracker.notifyChange("instance('countries')//country[@continent = instance('default')/continent]");
        tracker.processUpdates();

        expect(instanceControl.refreshed).to.be.true;
    });

/*
    it('Handles dependencies within repeated structures', () => {
        const repeatControl = new MockControl('repeatControl');
        tracker.register("/orders/order[@id = '123']/item[@sku = '456']", repeatControl);
        tracker.notifyChange("/orders/order[@id = '123']");
        tracker.processUpdates();
        expect(repeatControl.refreshed).to.be.true;
    });
*/

});
