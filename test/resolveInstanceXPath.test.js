import { expect } from '@open-wc/testing';
import { DependencyTracker } from '../src/DependencyTracker.js';

describe('DependencyTracker - resolveInstanceXPath Tests', () => {
    let tracker;

    beforeEach(() => {
        tracker = new DependencyTracker();
    });

    it('should leave already resolved paths starting with $ unchanged', () => {
        const result = tracker.resolveInstanceXPath("$foo/some/path");
        expect(result).to.equal("$foo/some/path");
    });

    it('should resolve instance() without arguments to $default/', () => {
        const result = tracker.resolveInstanceXPath("instance()/root/node");
        expect(result).to.equal("$default/root/node");
    });

    it('should resolve instance("foo") to $foo/', () => {
        const result = tracker.resolveInstanceXPath("instance('foo')/root/node");
        expect(result).to.equal("$foo/root/node");
    });

    it('should resolve instance("bar") to $bar/', () => {
        const result = tracker.resolveInstanceXPath("instance('bar')/data/item");
        expect(result).to.equal("$bar/data/item");
    });

    it('should resolve absolute paths without instance() to $default/', () => {
        const result = tracker.resolveInstanceXPath("/some/absolute/path");
        expect(result).to.equal("$default/some/absolute/path");
    });

    it('should resolve relative paths without instance() to $default/', () => {
        const result = tracker.resolveInstanceXPath("relative/path");
        expect(result).to.equal("$default/relative/path");
    });

    it('should handle instance() function without slashes correctly', () => {
        const result = tracker.resolveInstanceXPath("instance()/");
        expect(result).to.equal("$default/");
    });

    it('should handle instance("foo") without slashes correctly', () => {
        const result = tracker.resolveInstanceXPath("instance('foo')");
        expect(result).to.equal("$foo/");
    });

    it('should handle paths with multiple slashes correctly', () => {
        const result = tracker.resolveInstanceXPath("instance('foo')///deep///nested/path");
        expect(result).to.equal("$foo/deep/nested/path");
    });
});
