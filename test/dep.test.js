// var dep_graph = require("../lib/dep_graph");
// var DepGraph = dep_graph.DepGraph;
import { expect } from '@open-wc/testing';
import { DepGraph } from '../src/dep_graph.js';
// import DepGraph from '../src/dep_graph.js';

describe('DepGraph', () => {
  it('should be able to add/remove nodes', () => {
    const graph = new DepGraph();

    graph.addNode('Foo');
    graph.addNode('Bar');

    expect(graph.hasNode('Foo')).to.equal(true);
    expect(graph.hasNode('Bar')).to.equal(true);
    expect(graph.hasNode('NotThere')).to.equal(false);

    graph.removeNode('Bar');

    expect(graph.hasNode('Bar')).to.equal(false);
  });

  it('should calculate its size', () => {
    const graph = new DepGraph();

    // expect(graph.size()).toBe(0);
    expect(graph.size()).to.equal(0);

    graph.addNode('Foo');
    graph.addNode('Bar');

    // expect(graph.size()).toBe(2);
    expect(graph.size()).to.equal(2);

    graph.removeNode('Bar');

    expect(graph.size()).to.equal(1);
  });

  it('should treat the node data parameter as optional and use the node name as data if node data was not given', () => {
    const graph = new DepGraph();

    graph.addNode('Foo');

    // expect(graph.getNodeData("Foo")).toBe("Foo");
    expect(graph.getNodeData('Foo')).to.equal('Foo');
  });

  it('should be able to associate a node name with data on node add', () => {
    const graph = new DepGraph();

    graph.addNode('Foo', 'data');

    // expect(graph.getNodeData("Foo")).toBe("data");
    expect(graph.getNodeData('Foo')).to.equal('data');
  });

  it('should be able to add undefined as node data', () => {
    const graph = new DepGraph();

    graph.addNode('Foo', undefined);

    // expect(graph.getNodeData("Foo")).toBeUndefined();
    expect(graph.getNodeData('Foo')).to.be.undefined;
  });

  it('should return true when using hasNode with a node which has falsy data', () => {
    const graph = new DepGraph();

    const falsyData = ['', 0, null, undefined, false];
    graph.addNode('Foo');

    falsyData.forEach((data) => {
      graph.setNodeData('Foo', data);

      // expect(graph.hasNode("Foo")).toBeTrue();
      expect(graph.hasNode('Foo')).to.be.true;

      // Just an extra check to make sure that the saved data is correct
      // expect(graph.getNodeData("Foo")).toBe(data);
      expect(graph.getNodeData('Foo')).to.equal(data);
    });
  });

  it('should be able to set data after a node was added', () => {
    const graph = new DepGraph();

    graph.addNode('Foo', 'data');
    graph.setNodeData('Foo', 'data2');

    // expect(graph.getNodeData("Foo")).toBe("data2");
    expect(graph.getNodeData('Foo')).to.equal('data2');
  });

  it('should throw an error if we try to set data for a non-existing node', () => {
    const graph = new DepGraph();

    expect(() => {
      graph.setNodeData('Foo', 'data');
    }).to.throw('Node does not exist: Foo');
    // }).toThrow(new Error("Node does not exist: Foo"));
  });

  it('should throw an error if the node does not exists and we try to get data', () => {
    const graph = new DepGraph();

    expect(() => {
      graph.getNodeData('Foo');
    }).to.throw('Node does not exist: Foo');
    // }).toThrow(new Error("Node does not exist: Foo"));
  });

  it('should do nothing if creating a node that already exists', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');

    graph.addDependency('a', 'b');

    graph.addNode('a');

    // expect(graph.dependenciesOf("a")).toEqual(["b"]);
    expect(graph.dependenciesOf('a')).to.eql(['b']);
  });

  it('should do nothing if removing a node that does not exist', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    // expect(graph.hasNode("a")).toBeTrue();
    expect(graph.hasNode('a')).to.equal(true);

    graph.removeNode('a');
    // expect(graph.hasNode("Foo")).toBeFalse();
    expect(graph.hasNode('Foo')).to.equal(false);

    graph.removeNode('a');
    // expect(graph.hasNode("Foo")).toBeFalse();
    expect(graph.hasNode('Foo')).to.equal(false);
  });

  it('should be able to add dependencies between nodes', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');

    // expect(graph.dependenciesOf("a")).toEqual(["b", "c"]);
    expect(graph.dependenciesOf('a')).to.eql(['b', 'c']);
  });

  /*
    it("should find entry nodes", function () {
        const graph = new DepGraph();

        graph.addNode("a");
        graph.addNode("b");
        graph.addNode("c");

        graph.addDependency("a", "b");
        graph.addDependency("a", "c");

        // expect(graph.entryNodes()).toEqual(["a"]);
        expect(graph.entryNodes()).to.eql(["a"]);
    });
*/

  it('should throw an error if a node does not exist and a dependency is added', () => {
    const graph = new DepGraph();

    graph.addNode('a');

    expect(() => {
      graph.addDependency('a', 'b');
    }).to.throw('Node does not exist: b');
    // }).toThrow(new Error("Node does not exist: b"));
  });

  it('should detect cycles', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');
    graph.addDependency('d', 'a');

    window.addEventListener('compute-exception', (e) => {
      expect(e.detail.path).to.eql(['b', 'c', 'a', 'b']);
    });
    // expect.throws(() => graph.dependenciesOf("b"), new DepGraphCycleError(["b", "c", "a", "b"]));
  });

  it('should allow cycles when configured', () => {
    const graph = new DepGraph({ circular: true });

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');
    graph.addDependency('d', 'a');

    // expect(graph.dependenciesOf("b")).toEqual(["a", "c"]);
    expect(graph.dependenciesOf('b')).to.eql(['a', 'c']);
    // expect(graph.overallOrder()).toEqual(["c", "b", "a", "d"]);
    expect(graph.overallOrder()).to.eql(['c', 'b', 'a', 'd']);
  });

  it(
    'should include all nodes in overall order even from '
      + 'cycles in disconnected subgraphs when circular is true',
    () => {
      const graph = new DepGraph({ circular: true });

      graph.addNode('2a');
      graph.addNode('2b');
      graph.addNode('2c');
      graph.addDependency('2a', '2b');
      graph.addDependency('2b', '2c');
      graph.addDependency('2c', '2a');

      graph.addNode('1a');
      graph.addNode('1b');
      graph.addNode('1c');
      graph.addNode('1d');
      graph.addNode('1e');

      graph.addDependency('1a', '1b');
      graph.addDependency('1a', '1c');
      graph.addDependency('1b', '1c');
      graph.addDependency('1c', '1d');

      expect(graph.overallOrder()).to.eql(['1d', '1c', '1b', '1a', '1e', '2c', '2b', '2a']);
    },
  );

  it('should detect cycles in overall order', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');
    graph.addDependency('d', 'a');

    window.addEventListener('compute-exception', (e) => {
      expect(e.detail.path).to.eql(['a', 'b', 'c', 'a']);
    });

    /*
        expect(() => {
            graph.overallOrder();
        }).to.throw(new DepGraphCycleError(["a", "b", "c", "a"]));
*/
  });

  it('should detect cycles in overall order when all nodes have dependants (incoming edges)', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');

    window.addEventListener('compute-exception', (e) => {
      expect(e.detail.path).to.eql(['a', 'b', 'c', 'a']);
    });
    /*
        expect(() => {
            graph.overallOrder();
        }).to.throw(new DepGraphCycleError(["a", "b", "c", "a"]));
*/
  });

  it(
    'should detect cycles in overall order when there are several '
      + 'disconnected subgraphs (with one that does not have a cycle',
    () => {
      const graph = new DepGraph();

      graph.addNode('a_1');
      graph.addNode('a_2');
      graph.addNode('b_1');
      graph.addNode('b_2');
      graph.addNode('b_3');

      graph.addDependency('a_1', 'a_2');
      graph.addDependency('b_1', 'b_2');
      graph.addDependency('b_2', 'b_3');
      graph.addDependency('b_3', 'b_1');

      window.addEventListener('compute-exception', (e) => {
        expect(e.detail.path).to.eql(['b_1', 'b_2', 'b_3', 'b_1']);
      });

      /*
            expect(function () {
                graph.overallOrder();
            }).throws(
                new DepGraphCycleError(["b_1", "b_2", "b_3", "b_1"])
            );
*/
    },
  );

  it('should retrieve dependencies and dependants in the correct order', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'd');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('d', 'b');

    expect(graph.dependenciesOf('a')).to.eql(['c', 'b', 'd']);
    expect(graph.dependenciesOf('b')).to.eql(['c']);
    expect(graph.dependenciesOf('c')).to.eql([]);
    expect(graph.dependenciesOf('d')).to.eql(['c', 'b']);

    expect(graph.dependantsOf('a')).to.eql([]);
    expect(graph.dependantsOf('b')).to.eql(['a', 'd']);
    expect(graph.dependantsOf('c')).to.eql(['a', 'd', 'b']);
    expect(graph.dependantsOf('d')).to.eql(['a']);

    // check the alias "dependentsOf"
    expect(graph.dependentsOf('a')).to.eql([]);
    expect(graph.dependentsOf('b')).to.eql(['a', 'd']);
    expect(graph.dependentsOf('c')).to.eql(['a', 'd', 'b']);
    expect(graph.dependentsOf('d')).to.eql(['a']);
  });

  it('should be able to retrieve direct dependencies/dependants', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'd');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('d', 'b');

    expect(graph.directDependenciesOf('a')).to.eql(['d', 'b']);
    expect(graph.directDependenciesOf('b')).to.eql(['c']);
    expect(graph.directDependenciesOf('c')).to.eql([]);
    expect(graph.directDependenciesOf('d')).to.eql(['b']);

    expect(graph.directDependantsOf('a')).to.eql([]);
    expect(graph.directDependantsOf('b')).to.eql(['a', 'd']);
    expect(graph.directDependantsOf('c')).to.eql(['b']);
    expect(graph.directDependantsOf('d')).to.eql(['a']);

    // check the alias "directDependentsOf"
    expect(graph.directDependentsOf('a')).to.eql([]);
    expect(graph.directDependentsOf('b')).to.eql(['a', 'd']);
    expect(graph.directDependentsOf('c')).to.eql(['b']);
    expect(graph.directDependentsOf('d')).to.eql(['a']);
  });

  it('should be able to resolve the overall order of things', () => {
    const graph = new DepGraph();

    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');
    graph.addNode('a');
    graph.addNode('e');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'd');

    // expect(graph.overallOrder()).toEqual(["d", "c", "b", "a", "e"]);
    expect(graph.overallOrder()).to.eql(['d', 'c', 'b', 'a', 'e']);
  });

  it('should be able to only retrieve the "leaves" in the overall order', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');
    graph.addNode('e');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'd');

    // expect(graph.overallOrder(true)).toEqual(["d", "e"]);
    expect(graph.overallOrder(true)).to.eql(['d', 'e']);
  });

  it('should be able to give the overall order for a graph with several disconnected subgraphs', () => {
    const graph = new DepGraph();

    graph.addNode('a_1');
    graph.addNode('a_2');
    graph.addNode('b_1');
    graph.addNode('b_2');
    graph.addNode('b_3');

    graph.addDependency('a_1', 'a_2');
    graph.addDependency('b_1', 'b_2');
    graph.addDependency('b_2', 'b_3');

    expect(graph.overallOrder()).to.eql(['a_2', 'a_1', 'b_3', 'b_2', 'b_1']);
  });

  it('should give an empty overall order for an empty graph', () => {
    const graph = new DepGraph();

    expect(graph.overallOrder()).to.eql([]);
  });

  it('should still work after nodes are removed', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');

    expect(graph.dependenciesOf('a')).to.eql(['c', 'b']);

    graph.removeNode('c');

    expect(graph.dependenciesOf('a')).to.eql(['b']);
  });

  it('should clone an empty graph', () => {
    const graph = new DepGraph();
    expect(graph.size()).to.equal(0);
    const cloned = graph.clone();
    expect(cloned.size()).to.equal(0);

    expect(graph === cloned).to.equal(false);
  });

  it('should clone a non-empty graph', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');

    const cloned = graph.clone();

    expect(graph === cloned).to.equal(false);
    expect(cloned.hasNode('a')).to.equal(true);
    expect(cloned.hasNode('b')).to.equal(true);
    expect(cloned.hasNode('c')).to.equal(true);
    expect(cloned.dependenciesOf('a')).to.eql(['c', 'b']);
    expect(cloned.dependantsOf('c')).to.eql(['a', 'b']);

    // Changes to the original graph shouldn't affect the clone
    graph.removeNode('c');
    expect(graph.dependenciesOf('a')).to.eql(['b']);
    expect(cloned.dependenciesOf('a')).to.eql(['c', 'b']);

    graph.addNode('d');
    graph.addDependency('b', 'd');
    expect(graph.dependenciesOf('a')).to.eql(['d', 'b']);
    expect(cloned.dependenciesOf('a')).to.eql(['c', 'b']);
  });

  it('should only be a shallow clone', () => {
    const graph = new DepGraph();

    const data = { a: 42 };
    graph.addNode('a', data);

    const cloned = graph.clone();
    expect(graph === cloned).to.equal(false);
    expect(graph.getNodeData('a') === cloned.getNodeData('a')).to.equal(true);

    graph.getNodeData('a').a = 43;
    expect(cloned.getNodeData('a').a).to.equal(43);

    cloned.setNodeData('a', { a: 42 });
    expect(cloned.getNodeData('a').a).to.equal(42);
    expect(graph.getNodeData('a') === cloned.getNodeData('a')).to.equal(false);
  });

  it('should find entry nodes', () => {
    const graph = new DepGraph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');

    expect(graph.entryNodes()).to.eql(['a']);
  });
});

describe('DepGraph Performance', () => {
  it('should not exceed max call stack with a very deep graph', () => {
    const g = new DepGraph();
    const expected = [];
    for (let i = 0; i < 100000; i += 1) {
      const istr = i.toString();
      g.addNode(istr);
      expected.push(istr);
      if (i > 0) {
        g.addDependency(istr, (i - 1).toString());
      }
    }
    const order = g.overallOrder();
    expect(order).to.eql(expected);
  });

  it('should run an a reasonable amount of time for a very large graph', () => {
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const g = new DepGraph();
    const nodes = [];
    // Create a graph with 100000 nodes in it with 10 random connections to
    // lower numbered nodes
    for (let i = 0; i < 100000; i += 1) {
      nodes.push(i.toString());
      g.addNode(i.toString());
      for (let j = 0; j < 10; j += 1) {
        const dep = randInt(0, i);
        if (i !== dep) {
          g.addDependency(i.toString(), dep.toString());
        }
      }
    }
    const start = new Date().getTime();
    g.overallOrder();
    const end = new Date().getTime();
    expect(start - end).to.be.lessThan(1000);
  });
});
